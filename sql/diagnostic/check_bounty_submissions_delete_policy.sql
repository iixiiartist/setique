-- Check if DELETE policy exists for bounty_submissions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'bounty_submissions'
    AND cmd = 'DELETE'
ORDER BY policyname;

-- Also check all policies for reference
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'INSERT' THEN 'Insert policy'
        WHEN cmd = 'SELECT' THEN 'Select policy'
        WHEN cmd = 'UPDATE' THEN 'Update policy'
        WHEN cmd = 'DELETE' THEN 'Delete policy'
        ELSE 'Other'
    END as policy_type
FROM pg_policies
WHERE tablename = 'bounty_submissions'
ORDER BY cmd, policyname;
