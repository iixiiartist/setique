import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../supabase'
import { handleSupabaseError } from '../logger'
import { ERROR_MESSAGES } from '../errorMessages'

/**
 * Custom hook for fetching and managing all dashboard data
 * Centralizes data fetching logic for better maintainability and reusability
 * 
 * @param {Object} user - Authenticated user object
 * @param {Object} profile - User profile object with trust_level, etc.
 * @returns {Object} Dashboard data state and refetch function
 * 
 * @example
 * const { loading, error, data, refetch } = useDashboardData(user, profile);
 * const { myDatasets, earnings, myPurchases, ... } = data;
 */
export const useDashboardData = (user, profile) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Curator data
  const [myDatasets, setMyDatasets] = useState([])
  const [earnings, setEarnings] = useState(null)
  const [payoutAccount, setPayoutAccount] = useState(null)
  
  // Buyer data
  const [myPurchases, setMyPurchases] = useState([])
  const [myFavorites, setMyFavorites] = useState([])
  
  // Bounty data
  const [myBounties, setMyBounties] = useState([])
  const [mySubmissions, setMySubmissions] = useState([])
  
  // Curation requests data
  const [myCurationRequests, setMyCurationRequests] = useState([])
  const [openCurationRequests, setOpenCurationRequests] = useState([])
  const [curatorProfile, setCuratorProfile] = useState(null)
  const [curatorAssignedRequests, setCuratorAssignedRequests] = useState([])
  
  // Admin state
  const [deletionRequests, setDeletionRequests] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasModerationAccess, setHasModerationAccess] = useState(false)

  /**
   * Fetch all dashboard data
   * Optimized with parallel Promise.all batching for better performance
   */
  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Batch 1: Core user data (parallel execution)
      const [
        datasetsResult,
        earningsResult,
        payoutResult,
        purchasesResult,
        adminResult,
        favoritesResult
      ] = await Promise.all([
        // Fetch user's created datasets with partnership info
        supabase
          .from('datasets')
          .select(`
            *,
            dataset_partnerships (
              id,
              status,
              curator_user_id,
              pro_curators (
                display_name,
                badge_level
              )
            )
          `)
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false }),
        
        // Fetch earnings summary
        supabase
          .from('creator_earnings')
          .select('*')
          .eq('creator_id', user.id)
          .order('earned_at', { ascending: false }),
        
        // Fetch payout account
        supabase
          .from('creator_payout_accounts')
          .select('*')
          .eq('creator_id', user.id)
          .maybeSingle(),
        
        // Fetch user's purchases
        supabase
          .from('purchases')
          .select(`
            *,
            datasets (*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('purchased_at', { ascending: false }),
        
        // Check if user is admin
        supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        
        // Fetch user's favorited datasets
        supabase
          .from('dataset_favorites')
          .select(`
            *,
            datasets (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ])

      const datasets = datasetsResult.data || []
      
      // Batch fetch all purchase counts in ONE query instead of loop
      if (datasets.length > 0) {
        const datasetIds = datasets.map(d => d.id)
        const { data: purchaseCounts } = await supabase
          .from('purchases')
          .select('dataset_id')
          .in('dataset_id', datasetIds)
          .eq('status', 'completed')
        
        // Count purchases per dataset
        const countMap = {}
        purchaseCounts?.forEach(p => {
          countMap[p.dataset_id] = (countMap[p.dataset_id] || 0) + 1
        })
        
        // Add counts to datasets
        datasets.forEach(dataset => {
          dataset.purchase_count = countMap[dataset.id] || 0
        })
      }
      
      setMyDatasets(datasets)

      // Process earnings (already fetched in parallel)
      const earningsData = earningsResult.data || []
      const totalEarned = earningsData.reduce((sum, e) => sum + parseFloat(e.creator_net), 0) || 0
      const pendingEarnings = earningsData.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.creator_net), 0) || 0
      
      setEarnings({
        total: totalEarned,
        pending: pendingEarnings,
        paid: totalEarned - pendingEarnings,
        transactions: earningsData
      })

      // Process payout account (already fetched in parallel)
      const payout = payoutResult.data
      setPayoutAccount(payout)
      
      // Process purchases (already fetched in parallel)
      setMyPurchases(purchasesResult.data || [])
      
      // Process favorites (already fetched in parallel)
      setMyFavorites(favoritesResult.data || [])

      // Process admin status (already fetched in parallel)
      if (!adminResult.error && adminResult.data) {
        setIsAdmin(true)
      }

      // Check if user has moderation access (admin OR trust_level >= 3)
      const hasAdminAccess = !adminResult.error && adminResult.data
      const hasModeratorTrustLevel = profile?.trust_level >= 3
      if (hasAdminAccess || hasModeratorTrustLevel) {
        setHasModerationAccess(true)
      }
      
      // Verify Stripe account if needed (background, non-blocking)
      if (payout && payout.stripe_connect_account_id && !payout.payouts_enabled) {
        fetch('/.netlify/functions/verify-stripe-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId: user.id })
        })
          .then(res => res.json())
          .then(verifyData => {
            if (verifyData.success && verifyData.account?.payouts_enabled) {
              supabase
                .from('creator_payout_accounts')
                .select('*')
                .eq('creator_id', user.id)
                .single()
                .then(({ data }) => setPayoutAccount(data))
            }
          })
          .catch(err => {
            handleSupabaseError(err, 'backgroundVerifyStripeAccount')
            // Silent failure for background verification - no user notification needed
          })
      }

      // Batch 2: Bounty and curation data (parallel execution)
      const [
        bountiesResult,
        submissionsResult,
        curationRequestsResult,
        openRequestsResult,
        curatorProfileResult,
        deletionRequestsResult
      ] = await Promise.all([
        supabase.from('curation_requests').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
        supabase.from('bounty_submissions').select('*, curation_requests!request_id (*), datasets (*)').eq('creator_id', user.id).order('submitted_at', { ascending: false }),
        supabase.from('curation_requests').select('*, curator_proposals (id, status, curator_id, proposal_text, estimated_completion_days, suggested_price, created_at, pro_curators (id, display_name, badge_level, rating, total_projects, specialties)), curator_submissions (id, submission_number, file_name, file_size, file_path, completion_notes, changes_made, status, reviewer_feedback, created_at, reviewed_at)').eq('creator_id', user.id).order('created_at', { ascending: false }),
        supabase.from('curation_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(20),
        supabase.from('pro_curators').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('deletion_requests').select('*, datasets (id, title, description)').eq('requester_id', user.id).order('requested_at', { ascending: false })
      ])

      // Process bounties with proposals
      const bounties = bountiesResult.data || []
      if (bounties.length > 0) {
        const requestIds = bounties.map(b => b.id)
        const [proposalsResult, curatorsResult] = await Promise.all([
          supabase.from('curator_proposals').select('*').in('request_id', requestIds),
          supabase.from('pro_curators').select('id, display_name, badge_level')
        ])
        
        const proposalsWithCurators = (proposalsResult.data || []).map(proposal => ({
          ...proposal,
          pro_curators: (curatorsResult.data || []).find(c => c.id === proposal.curator_id)
        }))
        
        setMyBounties(bounties.map(bounty => ({
          ...bounty,
          curator_proposals: proposalsWithCurators.filter(p => p.request_id === bounty.id)
        })))
      } else {
        setMyBounties([])
      }

      setMySubmissions(submissionsResult.data || [])
      setMyCurationRequests(curationRequestsResult.data || [])
      setOpenCurationRequests(openRequestsResult.data || [])
      setCuratorProfile(curatorProfileResult.data)
      setDeletionRequests(deletionRequestsResult.data || [])

      // If user is a Pro Curator, fetch assigned requests
      const curatorData = curatorProfileResult.data
      if (curatorData) {
        const { data: assignedData } = await supabase
          .from('curation_requests')
          .select('*')
          .eq('assigned_curator_id', curatorData.id)
          .order('created_at', { ascending: false })

        if (assignedData && assignedData.length > 0) {
          const requestIds = assignedData.map(r => r.id)
          const creatorIds = assignedData.map(r => r.creator_id).filter(Boolean)

          // Fetch proposals and creator profiles in parallel
          const [proposalsResult, creatorsResult] = await Promise.all([
            supabase.from('curator_proposals').select('*').in('request_id', requestIds),
            supabase.from('profiles').select('id, username, avatar_url').in('id', creatorIds)
          ])

          const proposals = proposalsResult.data || []
          const creators = creatorsResult.data || []

          setCuratorAssignedRequests(assignedData.map(request => ({
            ...request,
            requestor: creators.find(c => c.id === request.creator_id) || null,
            curator_proposals: proposals.filter(p => p.request_id === request.id),
            accepted_proposal: proposals.filter(p => p.request_id === request.id && p.status === 'accepted')
          })))
        } else {
          setCuratorAssignedRequests([])
        }
      } else {
        setCuratorAssignedRequests([])
      }

    } catch (err) {
      handleSupabaseError(err, 'fetchDashboardData')
      setError(ERROR_MESSAGES.FETCH_DASHBOARD)
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  // Auto-fetch on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  return {
    loading,
    error,
    data: {
      // Curator Data
      myDatasets,
      earnings,
      payoutAccount,
      
      // Buyer Data
      myPurchases,
      myFavorites,
      
      // Bounty Data
      myBounties,
      mySubmissions,
      
      // Curation Data
      myCurationRequests,
      openCurationRequests,
      curatorProfile,
      curatorAssignedRequests,
      
      // Admin Data
      deletionRequests,
      isAdmin,
      hasModerationAccess,
    },
    refetch: fetchDashboardData,
  }
}
