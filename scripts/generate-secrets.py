#!/usr/bin/env python3
"""
Generate secure secrets for production deployment.
Run this script to generate JWT secrets and other required secrets.
"""

import secrets
import string

def generate_secret(length=64):
    """Generate a cryptographically secure random string."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_hex_secret(length=32):
    """Generate a hex-encoded secret."""
    return secrets.token_hex(length)

if __name__ == "__main__":
    print("🔐 Generating Production Secrets")
    print("=" * 50)
    
    print(f"JWT_SECRET_KEY={generate_hex_secret(32)}")
    print(f"NEXTAUTH_SECRET={generate_hex_secret(32)}")
    
    print("\n📋 Copy these values to:")
    print("- Render Environment Variables")
    print("- Vercel Environment Variables")
    print("- GitHub Secrets (for CI/CD)")
    
    print("\n⚠️  Keep these secrets secure and never commit them to git!") 