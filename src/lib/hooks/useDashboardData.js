import { useState, useCallback, useEffect } from 'react'
import { handleSupabaseError } from '../logger'
import { ERROR_MESSAGES } from '../errorMessages'
import * as dashboardService from '../../services/dashboardService'

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
      // Batch 1: Core user data (parallel execution using service layer)
      const [
        datasets,
        earningsData,
        payout,
        purchases,
        adminData,
        favorites
      ] = await Promise.all([
        dashboardService.fetchUserDatasets(user.id),
        dashboardService.fetchEarnings(user.id),
        dashboardService.fetchPayoutAccount(user.id),
        dashboardService.fetchUserPurchases(user.id),
        dashboardService.checkAdminStatus(user.id),
        dashboardService.fetchUserFavorites(user.id)
      ])
      
      // Batch fetch all purchase counts in ONE query
      if (datasets.length > 0) {
        const datasetIds = datasets.map(d => d.id)
        const countMap = await dashboardService.fetchDatasetPurchaseCounts(datasetIds)
        
        // Add counts to datasets
        datasets.forEach(dataset => {
          dataset.purchase_count = countMap[dataset.id] || 0
        })
      }
      
      setMyDatasets(datasets)

      // Process earnings
      const totalEarned = earningsData.reduce((sum, e) => sum + parseFloat(e.creator_net), 0) || 0
      const pendingEarnings = earningsData.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.creator_net), 0) || 0
      
      setEarnings({
        total: totalEarned,
        pending: pendingEarnings,
        paid: totalEarned - pendingEarnings,
        transactions: earningsData
      })

      // Set payout account
      setPayoutAccount(payout)
      
      // Set purchases
      setMyPurchases(purchases)
      
      // Set favorites
      setMyFavorites(favorites)

      // Process admin status
      if (adminData) {
        setIsAdmin(true)
      }

      // Check if user has moderation access (admin OR trust_level >= 3)
      const hasModAccess = dashboardService.checkModerationAccess(!!adminData, profile?.trust_level || 0)
      setHasModerationAccess(hasModAccess)
      
      // Verify Stripe account if needed (background, non-blocking)
      if (payout && payout.stripe_connect_account_id && !payout.payouts_enabled) {
        dashboardService.verifyStripeAccount(user.id)
          .then(verifyData => {
            if (verifyData.success && verifyData.account?.payouts_enabled) {
              dashboardService.fetchPayoutAccount(user.id)
                .then(data => setPayoutAccount(data))
            }
          })
          .catch(err => {
            handleSupabaseError(err, 'backgroundVerifyStripeAccount')
            // Silent failure for background verification - no user notification needed
          })
      }

      // Batch 2: Bounty and curation data (parallel execution using service layer)
      const [
        bounties,
        submissions,
        curationRequests,
        openRequests,
        curatorData,
        deletionReqs
      ] = await Promise.all([
        dashboardService.fetchUserBounties(user.id),
        dashboardService.fetchBountySubmissions(user.id),
        dashboardService.fetchCurationRequests(user.id),
        dashboardService.fetchOpenCurationRequests(20),
        dashboardService.fetchCuratorProfile(user.id),
        dashboardService.fetchDeletionRequests(user.id)
      ])

      // Process bounties with proposals
      if (bounties.length > 0) {
        const requestIds = bounties.map(b => b.id)
        const [proposals, curators] = await Promise.all([
          dashboardService.fetchBountyProposals(requestIds),
          dashboardService.fetchProCurators()
        ])
        
        const proposalsWithCurators = proposals.map(proposal => ({
          ...proposal,
          pro_curators: curators.find(c => c.id === proposal.curator_id)
        }))
        
        setMyBounties(bounties.map(bounty => ({
          ...bounty,
          curator_proposals: proposalsWithCurators.filter(p => p.request_id === bounty.id)
        })))
      } else {
        setMyBounties([])
      }

      setMySubmissions(submissions)
      setMyCurationRequests(curationRequests)
      setOpenCurationRequests(openRequests)
      setCuratorProfile(curatorData)
      setDeletionRequests(deletionReqs)

      // If user is a Pro Curator, fetch assigned requests
      if (curatorData) {
        const assignedData = await dashboardService.fetchAssignedRequests(curatorData.id)

        if (assignedData && assignedData.length > 0) {
          const requestIds = assignedData.map(r => r.id)
          const creatorIds = assignedData.map(r => r.creator_id).filter(Boolean)

          // Fetch proposals and creator profiles in parallel
          const [proposals, creators] = await Promise.all([
            dashboardService.fetchProposalsForRequests(requestIds),
            dashboardService.fetchCreatorProfiles(creatorIds)
          ])

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
