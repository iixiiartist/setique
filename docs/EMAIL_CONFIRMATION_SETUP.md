# Email Confirmation Setup for Beta Access

## The Proper Beta Flow

1. **User signs up** → Account created (unconfirmed)
2. **User checks email** → Clicks confirmation link
3. **Email confirmed** → Redirects to `/auth/callback` → Then to home
4. **User logs in** → BetaAccessGate shows "You're in the Beta Queue!"
5. **Admin approves** → Access code generated
6. **User enters code** → Full platform access granted

## Supabase Configuration Steps

### 1. Configure Site URL and Redirect URLs

Go to **Supabase Dashboard → Authentication → URL Configuration**:

**Site URL:**
```
https://setique.netlify.app
```

**Redirect URLs** (add all of these):
```
https://setique.netlify.app/**
https://setique.netlify.app/auth/callback
http://localhost:5173/**
http://localhost:5173/auth/callback
```

### 2. Update Email Template (Optional - already works with URL config)

Go to **Supabase Dashboard → Authentication → Email Templates → Confirm signup**

The default template should work, but if you want to customize:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>

<p>Welcome to SETIQUE - The Niche Data Ecosystem!</p>
```

The `{{ .ConfirmationURL }}` will automatically redirect to your Site URL + `/auth/callback`.

### 3. Keep Email Confirmation Enabled

**Do NOT disable email confirmation!** It's an important security step.

The flow now works seamlessly:
- Email confirmation handles identity verification
- Beta access system handles platform access control

## How It Works

1. **AuthCallbackPage** (`/auth/callback`) handles the confirmation token
2. Uses `supabase.auth.verifyOtp()` to confirm the email
3. Redirects to home page after confirmation
4. **BetaAccessGate** automatically shows for users without beta access
5. Users see their queue status and can enter access code when approved

## Testing the Flow

1. Sign up with a new test email
2. Check your inbox for "Confirm your signup" email
3. Click the confirmation link
4. Should redirect to setique.com with a success message
5. Login with your credentials
6. You'll see "You're in the Beta Queue!" (BetaAccessGate)
7. Admin approves you in dashboard
8. You enter the access code
9. Full access granted!

## Files Changed

- `src/pages/AuthCallbackPage.jsx` - New page to handle email confirmation
- `src/App.jsx` - Added `/auth/callback` route

## No Database Changes Needed

All the database work is already done. This is just frontend routing to handle Supabase's email confirmation callback.
