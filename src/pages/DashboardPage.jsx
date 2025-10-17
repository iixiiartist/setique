import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useModalState, useConfirmDialog } from '../lib/hooks/useModalState'
import { DatasetUploadModal } from '../components/DatasetUploadModal'
import CurationRequestModal from '../components/CurationRequestModal'
import ProposalsModal from '../components/ProposalsModal'
import ProposalSubmissionModal from '../components/ProposalSubmissionModal'
import { BountySubmissionModal } from '../components/BountySubmissionModal'
import CuratorSubmissionModal from '../components/CuratorSubmissionModal'
import DeletionRequestModal from '../components/DeletionRequestModal'
import ConfirmDialog from '../components/ConfirmDialog'
import TrustLevelBadge from '../components/TrustLevelBadge'
import FavoriteButton from '../components/FavoriteButton'
import NotificationBell from '../components/NotificationBell'
import { logBountyCreated } from '../lib/activityTracking'
import { handleSupabaseError } from '../lib/logger'
import { ERROR_MESSAGES } from '../lib/errorMessages'
import { ErrorBanner } from '../components/ErrorBanner'
import { OverviewTab } from '../components/dashboard/tabs/OverviewTab'
import { DatasetsTab } from '../components/dashboard/tabs/DatasetsTab'
import { PurchasesTab } from '../components/dashboard/tabs/PurchasesTab'
import { EarningsTab } from '../components/dashboard/tabs/EarningsTab'
import { BountiesTab } from '../components/dashboard/tabs/BountiesTab'
import { SubmissionsTab } from '../components/dashboard/tabs/SubmissionsTab'
import { CurationRequestsTab } from '../components/dashboard/tabs/CurationRequestsTab'
import { ProCuratorTab } from '../components/dashboard/tabs/ProCuratorTab'
import { ActivityTab } from '../components/dashboard/tabs/ActivityTab'
import { FavoritesTab } from '../components/dashboard/tabs/FavoritesTab'
import {
  Database,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  LogOut,
  Home,
  X,
  Star,
} from '../components/Icons'
// Note: Download, Edit, Trash, Eye, EyeOff, Upload, Package, tierDisplayInfo now used in tab components

function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletionRequests, setDeletionRequests] = useState([])
  const [deletionModalDataset, setDeletionModalDataset] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Modal states - Using useModalState hook (Phase 2 refactoring)
  const uploadModal = useModalState()
  const curationRequestModal = useModalState()
  const proposalsModal = useModalState()
  const proposalSubmissionModal = useModalState()
  const bountySubmissionModal = useModalState()
  const curatorSubmissionModal = useModalState()
  const editDatasetModal = useModalState()
  const confirmDialogModal = useConfirmDialog()
  
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
  const [expandedBounty, setExpandedBounty] = useState(null)
  
  // Curation requests data
  const [myCurationRequests, setMyCurationRequests] = useState([])
  const [openCurationRequests, setOpenCurationRequests] = useState([])
  const [curatorProfile, setCuratorProfile] = useState(null)
  const [curatorAssignedRequests, setCuratorAssignedRequests] = useState([])
  
  // Stripe Connect state
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [connectError, setConnectError] = useState(null)
  
  // Dataset management state
  const [actionLoading, setActionLoading] = useState(false)
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasModerationAccess, setHasModerationAccess] = useState(false)
  
  // Bounty creation modal state
  const [showBountyModal, setShowBountyModal] = useState(false)
  const [newBounty, setNewBounty] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    minimum_curator_tier: 'verified' // Default to Verified+ (recommended)
  })
  
  // Dataset detail modal state
  const [selectedDatasetForDetail, setSelectedDatasetForDetail] = useState(null)

  // TODO: Phase 6 - Extract into useDashboardData custom hook
  // Centralize all user dashboard data fetching for better maintainability
  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
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
      ]);

      const datasets = datasetsResult.data || [];
      
      // Batch fetch all purchase counts in ONE query instead of loop
      if (datasets.length > 0) {
        const datasetIds = datasets.map(d => d.id);
        const { data: purchaseCounts } = await supabase
          .from('purchases')
          .select('dataset_id')
          .in('dataset_id', datasetIds)
          .eq('status', 'completed');
        
        // Count purchases per dataset
        const countMap = {};
        purchaseCounts?.forEach(p => {
          countMap[p.dataset_id] = (countMap[p.dataset_id] || 0) + 1;
        });
        
        // Add counts to datasets
        datasets.forEach(dataset => {
          dataset.purchase_count = countMap[dataset.id] || 0;
        });
      }
      
      setMyDatasets(datasets)

      // Process earnings (already fetched in parallel)
      const earningsData = earningsResult.data || [];
      const totalEarned = earningsData.reduce((sum, e) => sum + parseFloat(e.creator_net), 0) || 0;
      const pendingEarnings = earningsData.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.creator_net), 0) || 0;
      
      setEarnings({
        total: totalEarned,
        pending: pendingEarnings,
        paid: totalEarned - pendingEarnings,
        transactions: earningsData
      });

      // Process payout account (already fetched in parallel)
      const payout = payoutResult.data;
      setPayoutAccount(payout);
      
      // Process purchases (already fetched in parallel)
      setMyPurchases(purchasesResult.data || []);
      
      // Process favorites (already fetched in parallel)
      setMyFavorites(favoritesResult.data || []);

      // Process admin status (already fetched in parallel)
      if (!adminResult.error && adminResult.data) {
        setIsAdmin(true);
      }

      // Check if user has moderation access (admin OR trust_level >= 3)
      const hasAdminAccess = !adminResult.error && adminResult.data;
      const hasModeratorTrustLevel = profile?.trust_level >= 3;
      if (hasAdminAccess || hasModeratorTrustLevel) {
        setHasModerationAccess(true);
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
                .then(({ data }) => setPayoutAccount(data));
            }
          })
          .catch(err => {
            handleSupabaseError(err, 'backgroundVerifyStripeAccount')
            // Silent failure for background verification - no user notification needed
          });
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
      ]);

      // Process bounties with proposals
      const bounties = bountiesResult.data || [];
      if (bounties.length > 0) {
        const requestIds = bounties.map(b => b.id);
        const [proposalsResult, curatorsResult] = await Promise.all([
          supabase.from('curator_proposals').select('*').in('request_id', requestIds),
          supabase.from('pro_curators').select('id, display_name, badge_level')
        ]);
        
        const proposalsWithCurators = (proposalsResult.data || []).map(proposal => ({
          ...proposal,
          pro_curators: (curatorsResult.data || []).find(c => c.id === proposal.curator_id)
        }));
        
        setMyBounties(bounties.map(bounty => ({
          ...bounty,
          curator_proposals: proposalsWithCurators.filter(p => p.request_id === bounty.id)
        })));
      } else {
        setMyBounties([]);
      }

      setMySubmissions(submissionsResult.data || []);
      setMyCurationRequests(curationRequestsResult.data || []);
      setOpenCurationRequests(openRequestsResult.data || []);
      setCuratorProfile(curatorProfileResult.data);
      setDeletionRequests(deletionRequestsResult.data || []);

      // If user is a Pro Curator, fetch assigned requests
      const curatorData = curatorProfileResult.data;
      if (curatorData) {
        const { data: assignedData } = await supabase
          .from('curation_requests')
          .select('*')
          .eq('assigned_curator_id', curatorData.id)
          .order('created_at', { ascending: false });

        if (assignedData && assignedData.length > 0) {
          const requestIds = assignedData.map(r => r.id);
          const creatorIds = assignedData.map(r => r.creator_id).filter(Boolean);

          // Fetch proposals and creator profiles in parallel
          const [proposalsResult, creatorsResult] = await Promise.all([
            supabase.from('curator_proposals').select('*').in('request_id', requestIds),
            supabase.from('profiles').select('id, username, avatar_url').in('id', creatorIds)
          ]);

          const proposals = proposalsResult.data || [];
          const creators = creatorsResult.data || [];

          setCuratorAssignedRequests(assignedData.map(request => ({
            ...request,
            requestor: creators.find(c => c.id === request.creator_id) || null,
            curator_proposals: proposals.filter(p => p.request_id === request.id),
            accepted_proposal: proposals.filter(p => p.request_id === request.id && p.status === 'accepted')
          })));
        } else {
          setCuratorAssignedRequests([]);
        }
      } else {
        setCuratorAssignedRequests([]);
      }

    } catch (error) {
      handleSupabaseError(error, 'fetchDashboardData')
      setError(ERROR_MESSAGES.FETCH_DASHBOARD)
    }

    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    
    fetchDashboardData()
    
    // Check for Stripe onboarding completion
    const urlParams = new URLSearchParams(window.location.search)
    const onboardingStatus = urlParams.get('onboarding')
    const tabParam = urlParams.get('tab')
    
    if (onboardingStatus === 'complete') {
      // Verify Stripe account status with Stripe API
      ;(async () => {
        try {
          const response = await fetch('/.netlify/functions/verify-stripe-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creatorId: user.id })
          })
          
          const data = await response.json()
          
          if (data.success) {
            alert(`✅ ${data.message || 'Stripe account connected successfully! Your payout account is now set up.'}`)
          } else {
            handleSupabaseError(new Error(data.message || 'Verification failed'), 'verifyStripeAccount')
            setError(ERROR_MESSAGES.STRIPE_VERIFY)
            alert(`⚠️ ${data.message || 'Account verification incomplete. Please complete all required information.'}`)
          }
        } catch (error) {
          handleSupabaseError(error, 'verifyStripeAccount')
          setError(ERROR_MESSAGES.STRIPE_VERIFY)
          alert('⚠️ Error verifying account status. Please refresh and try again.')
        }
        
        // Switch to earnings tab if not already there
        if (tabParam === 'earnings') {
          setActiveTab('earnings')
        }
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard')
        // Refresh data to show updated payout account
        setTimeout(() => fetchDashboardData(), 1000)
      })()
    } else if (onboardingStatus === 'refresh') {
      alert('⚠️ Stripe onboarding was interrupted. Please try again.')
      if (tabParam === 'earnings') {
        setActiveTab('earnings')
      }
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [user, navigate, fetchDashboardData])

  const handleDownload = async (datasetId) => {
    try {
      const response = await fetch('/.netlify/functions/generate-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetId: datasetId,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate download link')
      }

      // Handle demo datasets with data URLs
      if (data.isDemo && data.downloadUrl.startsWith('data:')) {
        // Create a download link for the data URL
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.fileName || 'DEMO_README.txt'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        alert('📝 Demo dataset info downloaded! This is a sample to showcase how Setique works. Real datasets include actual data files.')
      } else {
        // For real datasets, open in new tab
        window.open(data.downloadUrl, '_blank')
        alert('Download started! Link expires in 24 hours.')
      }
      
      // Refresh download logs
      fetchDashboardData()
    } catch (error) {
      handleSupabaseError(error, 'downloadDataset')
      setError(ERROR_MESSAGES.DOWNLOAD_DATASET)
      alert('Error: ' + error.message)
    }
  }

  // Dataset management handlers
  const handleToggleActive = async (datasetId, currentStatus) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('datasets')
        .update({ is_active: !currentStatus })
        .eq('id', datasetId)
        .eq('creator_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setMyDatasets(prev => 
        prev.map(d => d.id === datasetId ? { ...d, is_active: !currentStatus } : d)
      )
      
      alert(`Dataset ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
      handleSupabaseError(error, 'toggleDataset')
      setError(ERROR_MESSAGES.TOGGLE_DATASET)
      alert('Failed to update dataset status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditDataset = (dataset) => {
    editDatasetModal.open({
      id: dataset.id,
      title: dataset.title,
      description: dataset.description,
      price: dataset.price,
      modality: dataset.modality,
      tags: dataset.tags || []
    })
  }

  const handleSaveEdit = async () => {
    if (!editDatasetModal.data) return
    
    setActionLoading(true)
    try {
      const editData = editDatasetModal.data
      const { error } = await supabase
        .from('datasets')
        .update({
          title: editData.title,
          description: editData.description,
          price: parseFloat(editData.price),
          modality: editData.modality,
          tags: editData.tags,
        })
        .eq('id', editData.id)
        .eq('creator_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setMyDatasets(prev => 
        prev.map(d => d.id === editData.id ? { ...d, ...editData, price: parseFloat(editData.price) } : d)
      )
      
      editDatasetModal.close()
      alert('Dataset updated successfully!')
    } catch (error) {
      handleSupabaseError(error, 'updateDataset')
      setError(ERROR_MESSAGES.UPDATE_DATASET)
      alert('Failed to update dataset')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteDataset = async (datasetId) => {
    try {
      // Check if dataset has purchases
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('dataset_id', datasetId)
        .eq('status', 'completed')
        .limit(1)
      
      if (purchaseError) throw purchaseError
      
      const hasPurchases = purchases && purchases.length > 0
      
      // Show confirmation dialog
      confirmDialogModal.show({
        title: hasPurchases ? 'Delete Dataset with Purchases?' : 'Delete Dataset?',
        message: hasPurchases 
          ? '⚠️ This dataset has purchases! Deleting it will break download access for buyers. This action cannot be undone. Are you absolutely sure?'
          : 'Are you sure you want to delete this dataset? This action cannot be undone.',
        onConfirm: async () => {
          setActionLoading(true)
          try {
            // Call Netlify function to delete (bypasses RLS)
            const response = await fetch('/.netlify/functions/delete-dataset', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                datasetId: datasetId,
                userId: user.id
              })
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || 'Failed to delete dataset')
            }

            alert('✅ Dataset deleted successfully')
            await fetchDashboardData()
          } catch (error) {
            handleSupabaseError(error, 'deleteDataset')
            setError(ERROR_MESSAGES.DELETE_DATASET)
            alert('Failed to delete dataset: ' + error.message)
          } finally {
            setActionLoading(false)
          }
        }
      })
    } catch (error) {
      handleSupabaseError(error, 'checkDatasetPurchases')
      setError(ERROR_MESSAGES.DELETE_DATASET)
      alert('Failed to check dataset status: ' + error.message)
    }
  }

  const handleRequestDeletion = async (datasetId, reason) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/.netlify/functions/request-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          datasetId,
          reason
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit deletion request')
      }

      alert('Deletion request submitted! An admin will review your request.')
      
      // Refresh deletion requests
      await fetchDashboardData()
    } catch (error) {
      handleSupabaseError(error, 'requestDeletion')
      setError(ERROR_MESSAGES.REQUEST_DELETION)
      throw error
    }
  }

  const handleCreateBounty = async () => {
    if (!newBounty.title || !newBounty.description || !newBounty.budget_max) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const { data: createdBounty, error } = await supabase.from('curation_requests').insert([
        {
          creator_id: user.id,
          title: newBounty.title,
          description: newBounty.description,
          budget_min: parseFloat(newBounty.budget_min) || parseFloat(newBounty.budget_max) * 0.8,
          budget_max: parseFloat(newBounty.budget_max),
          status: 'open',
          target_quality: 'standard',
          specialties_needed: [],
          minimum_curator_tier: newBounty.minimum_curator_tier
        }
      ]).select()

      if (error) throw error

      // Log activity for social feed
      if (createdBounty && createdBounty[0]) {
        await logBountyCreated(
          user.id,
          createdBounty[0].id,
          newBounty.title,
          parseFloat(newBounty.budget_max)
        )
      }

      alert(`Bounty "${newBounty.title}" posted successfully!`)
      setShowBountyModal(false)
      setNewBounty({
        title: '',
        description: '',
        budget_min: '',
        budget_max: '',
        minimum_curator_tier: 'verified'
      })
      await fetchDashboardData()
    } catch (error) {
      handleSupabaseError(error, 'createBounty')
      setError(ERROR_MESSAGES.CREATE_BOUNTY)
      alert('Failed to create bounty: ' + error.message)
    }
  }

  const handleCloseMyBounty = async (bountyId) => {
    if (!window.confirm('Close this bounty? No more proposals will be accepted.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('curation_requests')
        .update({ status: 'closed' })
        .eq('id', bountyId)
        .eq('creator_id', user.id) // Only allow closing own bounties

      if (error) throw error

      alert('✅ Bounty closed successfully!')
      
      // Refresh bounties
      await fetchDashboardData()
    } catch (error) {
      handleSupabaseError(error, 'closeBounty')
      setError(ERROR_MESSAGES.CLOSE_BOUNTY)
      alert('Failed to close bounty: ' + error.message)
    }
  }

  const handleDeleteBountySubmission = async (submissionId, datasetTitle) => {
    if (!window.confirm(`Delete your submission "${datasetTitle}"? This cannot be undone.`)) {
      return
    }

    try {
      const { data, error } = await supabase
        .from('bounty_submissions')
        .delete()
        .eq('id', submissionId)
        .eq('creator_id', user.id) // Only allow deleting own submissions
        .select() // Return deleted row to confirm

      if (error) {
        handleSupabaseError(error, 'deleteBountySubmission')
        throw error
      }

      if (!data || data.length === 0) {
        handleSupabaseError(new Error('No rows deleted - RLS policy issue'), 'deleteBountySubmission')
        alert('⚠️ Could not delete submission. You may not have permission or the submission may already be deleted.')
        return
      }

      alert('✅ Submission deleted successfully!')
      
      // Refresh submissions
      await fetchDashboardData()
    } catch (error) {
      handleSupabaseError(error, 'deleteBountySubmission')
      setError(ERROR_MESSAGES.DELETE_BOUNTY_SUBMISSION)
      alert('Failed to delete submission: ' + error.message)
    }
  }

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    setConnectError(null)
    
    try {
      const returnUrl = `${window.location.origin}/dashboard?tab=earnings&onboarding=complete`
      const refreshUrl = `${window.location.origin}/dashboard?tab=earnings&onboarding=refresh`
      
      const response = await fetch('/.netlify/functions/connect-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: user.id,
          email: profile?.email || user.email,
          returnUrl,
          refreshUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Stripe Connect link')
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url
    } catch (error) {
      handleSupabaseError(error, 'handleStripeConnect')
      setError(ERROR_MESSAGES.STRIPE_CONNECT)
      setConnectError(error.message)
      setConnectingStripe(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-2xl font-extrabold text-black">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const totalSpent = myPurchases.reduce((sum, p) => sum + parseFloat(p.amount), 0)

  // TODO: Phase 3 - Extract tab panels into separate components
  // Create: DatasetsTab, PurchasesTab, EarningsTab, BountiesTab, CurationTab, FavoritesTab
  // Each component should handle its own state and event handlers
  
  // TODO: Phase 4 - Standardize error handling
  // Add try-catch with consistent error messages and user feedback
  // Implement error boundaries for graceful failure
  
  // TODO: Phase 5 - Extract modals into separate components
  // Move: DatasetUploadModal, CurationRequestModal, BountyCreationModal, etc.
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300 text-black font-sans">
      {/* Header */}
      <header className="border-b-4 border-black bg-white/90 backdrop-blur sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <a href="/" className="no-underline">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tighter">
                <span className="bg-[linear-gradient(90deg,#ff00c3,#00ffff,#ffea00)] bg-clip-text text-transparent drop-shadow-[2px_2px_0_#000]">
                  SETIQUE
                </span>
              </h1>
            </a>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 font-bold text-black text-sm">
                {profile?.username || user.email}
              </div>
              
              {/* Notification Bell */}
              <NotificationBell />
              
              <button
                onClick={() => navigate('/')}
                className="font-bold text-black hover:text-cyan-600 transition flex items-center gap-1 text-sm"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => navigate('/feed')}
                className="font-bold text-black hover:text-purple-600 transition flex items-center gap-1 text-sm"
              >
                <TrendingUp className="h-4 w-4" />
                Activity Feed
              </button>
              {hasModerationAccess && (
                <button
                  onClick={() => navigate('/moderation')}
                  className="font-bold text-red-600 hover:text-red-700 transition flex items-center gap-1 text-sm"
                  title="Moderation Queue"
                >
                  🚩 Moderation
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="font-bold text-black hover:text-pink-600 transition flex items-center gap-1 text-sm"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex flex-col gap-1.5 p-2 hover:bg-gray-100 rounded transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`block h-0.5 w-6 bg-black transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block h-0.5 w-6 bg-black transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block h-0.5 w-6 bg-black transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 py-4 border-t-2 border-black space-y-3">
              <div className="px-4 py-2 font-bold text-black bg-gray-100 rounded">
                {profile?.username || user.email}
              </div>
              <button
                onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2 font-bold text-black hover:bg-cyan-100 rounded transition flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => { navigate('/feed'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2 font-bold text-black hover:bg-purple-100 rounded transition flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Activity Feed
              </button>
              {hasModerationAccess && (
                <button
                  onClick={() => { navigate('/moderation'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 font-bold text-red-600 hover:bg-red-100 rounded transition flex items-center gap-2"
                  title="Moderation Queue"
                >
                  🚩 Moderation
                </button>
              )}
              <button
                onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2 font-bold text-black hover:bg-pink-100 rounded transition flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Error Banner */}
        <ErrorBanner 
          message={error}
          onDismiss={() => setError(null)}
        />
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl md:text-4xl font-extrabold">
                  Welcome back, {profile?.username || 'there'}! 👋
                </h2>
                {profile && <TrustLevelBadge level={profile.trust_level || 0} size="md" />}
              </div>
              <p className="text-lg font-semibold text-black/70">
                Here&apos;s what&apos;s happening with your data economy
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {profile?.username && (
                <a
                  href={`/profile/${profile.username}`}
                  className="bg-purple-400 text-black font-bold px-6 py-3 rounded-full border-2 border-black shadow-[4px_4px_0_#000] hover:scale-105 transition flex items-center justify-center gap-2 text-center"
                >
                  👤 View Profile
                </a>
              )}
              {isAdmin && (
                <a
                  href="/admin"
                  className="bg-red-500 text-white font-bold px-6 py-3 rounded-full border-2 border-black shadow-[4px_4px_0_#000] hover:scale-105 transition flex items-center justify-center gap-2 text-center"
                >
                  🔐 Admin Dashboard
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-200 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <Database className="h-8 w-8 mb-2 text-pink-600" />
            <div className="text-3xl font-extrabold">{myDatasets.length}</div>
            <div className="text-sm font-bold">Datasets Created</div>
          </div>
          <div className="bg-cyan-200 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <ShoppingBag className="h-8 w-8 mb-2 text-pink-600" />
            <div className="text-3xl font-extrabold">{myPurchases.length}</div>
            <div className="text-sm font-bold">Datasets Purchased</div>
          </div>
          <div className="bg-pink-200 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <DollarSign className="h-8 w-8 mb-2 text-cyan-600" />
            <div className="text-3xl font-extrabold">${earnings?.total.toFixed(2) || '0.00'}</div>
            <div className="text-sm font-bold">Total Earned</div>
          </div>
          <div className="bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <TrendingUp className="h-8 w-8 mb-2 text-yellow-600" />
            <div className="text-3xl font-extrabold">${totalSpent.toFixed(2)}</div>
            <div className="text-sm font-bold">Total Spent</div>
          </div>
        </div>

        {/* Tabs - Accessible tab navigation with ARIA attributes */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Dashboard sections">
          <button
            onClick={() => setActiveTab('overview')}
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'overview'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            role="tab"
            aria-selected={activeTab === 'datasets'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'datasets'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Datasets ({myDatasets.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            role="tab"
            aria-selected={activeTab === 'purchases'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'purchases'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Purchases ({myPurchases.length})
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            role="tab"
            aria-selected={activeTab === 'earnings'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'earnings'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Earnings
          </button>
          <button
            onClick={() => setActiveTab('bounties')}
            role="tab"
            aria-selected={activeTab === 'bounties'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'bounties'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Bounties ({myBounties.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            role="tab"
            aria-selected={activeTab === 'submissions'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'submissions'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Submissions ({mySubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('curation-requests')}
            role="tab"
            aria-selected={activeTab === 'curation-requests'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'curation-requests'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Requests ({myCurationRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('pro-curator')}
            role="tab"
            aria-selected={activeTab === 'pro-curator'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition flex items-center gap-2 ${
              activeTab === 'pro-curator'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Star className="h-4 w-4 fill-current" />
            Pro Curator
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            role="tab"
            aria-selected={activeTab === 'activity'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'activity'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Activity Feed
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            role="tab"
            aria-selected={activeTab === 'favorites'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'favorites'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Favorites
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              myPurchases={myPurchases}
              myDatasets={myDatasets}
              earnings={earnings}
              handleDownload={handleDownload}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'datasets' && (
            <DatasetsTab
              myDatasets={myDatasets}
              deletionRequests={deletionRequests}
              isAdmin={isAdmin}
              actionLoading={actionLoading}
              handleToggleActive={handleToggleActive}
              handleEditDataset={handleEditDataset}
              handleDeleteDataset={handleDeleteDataset}
              setDeletionModalDataset={setDeletionModalDataset}
              uploadModal={uploadModal}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesTab
              myPurchases={myPurchases}
              handleDownload={handleDownload}
              navigate={navigate}
            />
          )}

          {activeTab === 'earnings' && (
            <EarningsTab
              earnings={earnings}
              payoutAccount={payoutAccount}
              connectingStripe={connectingStripe}
              connectError={connectError}
              handleConnectStripe={handleConnectStripe}
            />
          )}

          {/* My Bounties Tab */}
          {activeTab === 'bounties' && (
            <BountiesTab
              openCurationRequests={openCurationRequests}
              myBounties={myBounties}
              profile={profile}
              user={user}
              expandedBounty={expandedBounty}
              setExpandedBounty={setExpandedBounty}
              setShowBountyModal={setShowBountyModal}
              handleCloseMyBounty={handleCloseMyBounty}
              bountySubmissionModal={bountySubmissionModal}
              navigate={navigate}
            />
          )}

          {/* My Submissions Tab */}
          {activeTab === 'submissions' && (
            <SubmissionsTab
              mySubmissions={mySubmissions}
              handleDeleteBountySubmission={handleDeleteBountySubmission}
              navigate={navigate}
            />
          )}

          {/* My Curation Requests Tab */}
          {activeTab === 'curation-requests' && (
            <CurationRequestsTab
              myCurationRequests={myCurationRequests}
              curationRequestModal={curationRequestModal}
              proposalsModal={proposalsModal}
              fetchDashboardData={fetchDashboardData}
              setError={setError}
            />
          )}

          {/* Pro Curator Tab */}
          {activeTab === 'pro-curator' && (
            <ProCuratorTab
              curatorProfile={curatorProfile}
              curatorAssignedRequests={curatorAssignedRequests}
              openCurationRequests={openCurationRequests}
              curationRequestModal={curationRequestModal}
              proposalSubmissionModal={proposalSubmissionModal}
              curatorSubmissionModal={curatorSubmissionModal}
            />
          )}

          {/* Activity Feed Tab */}
          {activeTab === 'activity' && (
            <ActivityTab />
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <FavoritesTab myFavorites={myFavorites} navigate={navigate} />
          )}
        </div>
      </main>
      
      {/* Edit Dataset Modal */}
      {editDatasetModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border-4 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold">Edit Dataset</h3>
                <button
                  onClick={editDatasetModal.close}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Title</label>
                  <input
                    type="text"
                    value={editDatasetModal.data?.title || ''}
                    onChange={(e) => editDatasetModal.updateData({ ...editDatasetModal.data, title: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    placeholder="Dataset title"
                  />
                </div>
                
                <div>
                  <label className="block font-bold mb-2">Description</label>
                  <textarea
                    value={editDatasetModal.data?.description || ''}
                    onChange={(e) => editDatasetModal.updateData({ ...editDatasetModal.data, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    rows="4"
                    placeholder="Describe your dataset..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-2">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editDatasetModal.data?.price || ''}
                      onChange={(e) => editDatasetModal.updateData({ ...editDatasetModal.data, price: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    />
                  </div>
                  
                  <div>
                    <label className="block font-bold mb-2">Modality</label>
                    <select
                      value={editDatasetModal.data?.modality || 'vision'}
                      onChange={(e) => editDatasetModal.updateData({ ...editDatasetModal.data, modality: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    >
                      <option value="vision">Vision</option>
                      <option value="audio">Audio</option>
                      <option value="text">Text</option>
                      <option value="multimodal">Multimodal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block font-bold mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editDatasetModal.data?.tags?.join(', ') || ''}
                    onChange={(e) => editDatasetModal.updateData({ 
                      ...editDatasetModal.data, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                    })}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    placeholder="machine-learning, computer-vision, nlp"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading}
                  className="flex-1 bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={editDatasetModal.close}
                  className="flex-1 bg-gray-200 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Dataset Modal */}
      <DatasetUploadModal 
        isOpen={uploadModal.isOpen}
        onClose={uploadModal.close}
        onSuccess={fetchDashboardData}
      />
      
      {/* Curation Request Modal */}
      <CurationRequestModal 
        isOpen={curationRequestModal.isOpen}
        onClose={curationRequestModal.close}
        onSuccess={fetchDashboardData}
      />
      
      {/* Proposals Modal */}
      <ProposalsModal 
        isOpen={proposalsModal.isOpen}
        onClose={proposalsModal.close}
        request={proposalsModal.data}
        onAccept={fetchDashboardData}
      />
      
      {/* Proposal Submission Modal */}
      <ProposalSubmissionModal 
        isOpen={proposalSubmissionModal.isOpen}
        onClose={proposalSubmissionModal.close}
        request={proposalSubmissionModal.data}
        curatorProfile={curatorProfile}
        userProfile={profile}
        onSuccess={fetchDashboardData}
      />

      {/* Bounty Submission Modal - For custom dataset uploads to bounties */}
      <BountySubmissionModal
        isOpen={bountySubmissionModal.isOpen}
        onClose={bountySubmissionModal.close}
        bounty={bountySubmissionModal.data}
        onSuccess={fetchDashboardData}
      />

      {/* Curator Submission Modal */}
      <CuratorSubmissionModal
        isOpen={curatorSubmissionModal.isOpen}
        onClose={curatorSubmissionModal.close}
        request={curatorSubmissionModal.data}
        curatorProfile={curatorProfile}
        onSuccess={fetchDashboardData}
      />

      {/* Deletion Request Modal */}
      {deletionModalDataset && (
        <DeletionRequestModal
          dataset={deletionModalDataset}
          onClose={() => setDeletionModalDataset(null)}
          onSubmit={handleRequestDeletion}
        />
      )}

      {/* Bounty Creation Modal */}
      {showBountyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-black">Post a Bounty</h2>
              <button
                onClick={() => setShowBountyModal(false)}
                className="text-2xl font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-2">Title *</label>
                <input
                  type="text"
                  value={newBounty.title}
                  onChange={(e) => setNewBounty({...newBounty, title: e.target.value})}
                  placeholder="e.g., High-quality audio of rain sounds"
                  className="w-full border-2 border-black rounded-lg px-4 py-3 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Description *</label>
                <textarea
                  value={newBounty.description}
                  onChange={(e) => setNewBounty({...newBounty, description: e.target.value})}
                  placeholder="Describe what you need in detail..."
                  rows={4}
                  className="w-full border-2 border-black rounded-lg px-4 py-3 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-2">Min Budget</label>
                  <input
                    type="number"
                    value={newBounty.budget_min}
                    onChange={(e) => setNewBounty({...newBounty, budget_min: e.target.value})}
                    placeholder="100"
                    className="w-full border-2 border-black rounded-lg px-4 py-3 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2">Max Budget *</label>
                  <input
                    type="number"
                    value={newBounty.budget_max}
                    onChange={(e) => setNewBounty({...newBounty, budget_max: e.target.value})}
                    placeholder="200"
                    className="w-full border-2 border-black rounded-lg px-4 py-3 font-semibold"
                  />
                </div>
              </div>

              <div className="border-4 border-black rounded-xl p-4 bg-gradient-to-br from-cyan-50 to-purple-50">
                <label className="block font-bold mb-3 flex items-center gap-2">
                  🎯 Curator Access Level *
                </label>
                <p className="text-sm font-semibold text-gray-700 mb-4">
                  Who can apply to this bounty?
                </p>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/50 transition">
                    <input
                      type="radio"
                      name="curator_tier"
                      value="newcomer"
                      checked={newBounty.minimum_curator_tier === 'newcomer'}
                      onChange={(e) => setNewBounty({...newBounty, minimum_curator_tier: e.target.value})}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-black">Open to All Curators</div>
                      <div className="text-sm text-gray-600">Get more applicants. Best for simpler tasks.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/50 transition border-2 border-cyan-400 bg-cyan-50/50">
                    <input
                      type="radio"
                      name="curator_tier"
                      value="verified"
                      checked={newBounty.minimum_curator_tier === 'verified'}
                      onChange={(e) => setNewBounty({...newBounty, minimum_curator_tier: e.target.value})}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-black flex items-center gap-2">
                        Verified+ Curators Only <span className="text-xs bg-cyan-200 px-2 py-0.5 rounded-full border border-black">Recommended</span>
                      </div>
                      <div className="text-sm text-gray-600">Quality-vetted curators with proven track record.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/50 transition">
                    <input
                      type="radio"
                      name="curator_tier"
                      value="expert"
                      checked={newBounty.minimum_curator_tier === 'expert'}
                      onChange={(e) => setNewBounty({...newBounty, minimum_curator_tier: e.target.value})}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-black">Expert+ Curators Only</div>
                      <div className="text-sm text-gray-600">Experienced curators for complex datasets. Higher quality, fewer applicants.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/50 transition">
                    <input
                      type="radio"
                      name="curator_tier"
                      value="master"
                      checked={newBounty.minimum_curator_tier === 'master'}
                      onChange={(e) => setNewBounty({...newBounty, minimum_curator_tier: e.target.value})}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-black">Master Curators Only ⭐</div>
                      <div className="text-sm text-gray-600">Top-tier experts only. Premium work. Very selective, highest quality.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateBounty}
                  className="flex-1 bg-purple-400 hover:bg-purple-500 border-4 border-black rounded-xl px-6 py-3 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Post Bounty
                </button>
                <button
                  onClick={() => setShowBountyModal(false)}
                  className="px-6 py-3 border-4 border-black rounded-xl font-bold hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Detail Modal */}
      {selectedDatasetForDetail && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDatasetForDetail(null)}>
          <div 
            className="bg-white border-4 border-black rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-[12px_12px_0_#000]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-300 to-pink-300 border-b-4 border-black p-6 flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-3xl font-black mb-2">{selectedDatasetForDetail.title}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-sm font-bold border-2 border-black bg-yellow-100 text-yellow-800">
                    {selectedDatasetForDetail.modality}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-bold border-2 border-black bg-purple-100 text-purple-800">
                    ${selectedDatasetForDetail.price}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDatasetForDetail(null)}
                className="text-3xl font-bold hover:opacity-70 transition-opacity"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-xl font-extrabold mb-2">Description</h3>
                <p className="text-black/80 leading-relaxed">{selectedDatasetForDetail.description}</p>
              </div>

              {/* Tags */}
              {selectedDatasetForDetail.tags && selectedDatasetForDetail.tags.length > 0 && (
                <div>
                  <h3 className="text-xl font-extrabold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDatasetForDetail.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-sm font-bold border-2 border-black bg-gray-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border-2 border-black rounded-xl p-4">
                  <div className="text-sm font-bold text-black/60 mb-1">File Size</div>
                  <div className="text-lg font-extrabold">
                    {selectedDatasetForDetail.file_size 
                      ? `${(selectedDatasetForDetail.file_size / (1024 * 1024)).toFixed(2)} MB`
                      : 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-50 border-2 border-black rounded-xl p-4">
                  <div className="text-sm font-bold text-black/60 mb-1">Published</div>
                  <div className="text-lg font-extrabold">
                    {new Date(selectedDatasetForDetail.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t-2 border-black">
                <FavoriteButton
                  datasetId={selectedDatasetForDetail.id}
                  datasetTitle={selectedDatasetForDetail.title}
                  ownerId={selectedDatasetForDetail.user_id}
                  initialCount={selectedDatasetForDetail.favorite_count || 0}
                  size="lg"
                />
                <button
                  onClick={() => setSelectedDatasetForDetail(null)}
                  className="flex-1 bg-white border-2 border-black rounded-full px-6 py-3 font-extrabold hover:bg-gray-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogModal.isOpen}
        onClose={confirmDialogModal.cancel}
        onConfirm={confirmDialogModal.confirm}
        title={confirmDialogModal.title}
        message={confirmDialogModal.message}
      />
    </div>
  )
}

export default DashboardPage


