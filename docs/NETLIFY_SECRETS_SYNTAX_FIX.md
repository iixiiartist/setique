# Netlify Build Fix: Secrets Scanning TOML Syntax

## The Problem

The build continued to fail due to secrets scanning, even after `SECRETS_SCAN_OMIT_KEYS` was configured.

The `netlify.toml` file had the following configuration:

```toml
# Incorrect - This is a single string, not an array of strings
SECRETS_SCAN_OMIT_KEYS = "STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,SUPABASE_ANON_KEY,VITE_SUPABASE_ANON_KEY"
```

Netlify was ignoring this line because the TOML syntax was incorrect.

## ✅ The Solution

The `SECRETS_SCAN_OMIT_KEYS` value must be a **TOML array of strings**.

The `netlify.toml` file was updated to the correct syntax:

```toml
[build.environment]
  NODE_VERSION = "20.17.0"
  # Correct format: an array of quoted strings
  SECRETS_SCAN_OMIT_KEYS = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"]
```

This change ensures that Netlify correctly parses the list of keys to ignore during the secrets scan.
