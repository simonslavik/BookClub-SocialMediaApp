#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Environment Configuration Validator               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((ERRORS++))
        return 1
    fi
}

# Function to check environment variable in file
check_env_var() {
    local file=$1
    local var=$2
    local optional=$3
    
    if [ -f "$file" ]; then
        if grep -q "^${var}=" "$file"; then
            local value=$(grep "^${var}=" "$file" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            
            # Check for placeholder values
            if [[ "$value" == *"your-"* ]] || [[ "$value" == *"change-this"* ]]; then
                echo -e "${YELLOW}⚠${NC}  $var is set but using placeholder value"
                ((WARNINGS++))
            elif [ -z "$value" ]; then
                if [ "$optional" = "optional" ]; then
                    echo -e "${YELLOW}⚠${NC}  $var is empty (optional)"
                    ((WARNINGS++))
                else
                    echo -e "${RED}✗${NC} $var is empty"
                    ((ERRORS++))
                fi
            else
                echo -e "${GREEN}✓${NC} $var is set"
            fi
        else
            if [ "$optional" = "optional" ]; then
                echo -e "${YELLOW}⚠${NC}  $var not found (optional)"
                ((WARNINGS++))
            else
                echo -e "${RED}✗${NC} $var not found"
                ((ERRORS++))
            fi
        fi
    fi
}

echo -e "${BLUE}📁 Checking Configuration Files...${NC}"
echo ""

# Check user-service .env
echo "User Service (.env):"
check_file "backend/user-service/.env"
if [ -f "backend/user-service/.env" ]; then
    check_env_var "backend/user-service/.env" "DATABASE_URL"
    check_env_var "backend/user-service/.env" "JWT_SECRET"
    check_env_var "backend/user-service/.env" "JWT_REFRESH_SECRET"
    check_env_var "backend/user-service/.env" "GOOGLE_CLIENT_ID"
    check_env_var "backend/user-service/.env" "GOOGLE_CLIENT_SECRET"
    check_env_var "backend/user-service/.env" "PORT" "optional"
fi
echo ""

# Check frontend .env
echo "Frontend (.env):"
check_file "frontend/.env"
if [ -f "frontend/.env" ]; then
    check_env_var "frontend/.env" "VITE_GOOGLE_CLIENT_ID"
fi
echo ""

# Check if Google Client IDs match
echo -e "${BLUE}🔐 Checking Google OAuth Configuration...${NC}"
if [ -f "backend/user-service/.env" ] && [ -f "frontend/.env" ]; then
    backend_client_id=$(grep "^GOOGLE_CLIENT_ID=" "backend/user-service/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    frontend_client_id=$(grep "^VITE_GOOGLE_CLIENT_ID=" "frontend/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ "$backend_client_id" = "$frontend_client_id" ]; then
        echo -e "${GREEN}✓${NC} Google Client IDs match between frontend and backend"
    else
        echo -e "${RED}✗${NC} Google Client IDs DO NOT match!"
        echo -e "   Backend: $backend_client_id"
        echo -e "   Frontend: $frontend_client_id"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC}  Could not verify Google Client ID match"
    ((WARNINGS++))
fi
echo ""

# Check if node_modules exist
echo -e "${BLUE}📦 Checking Dependencies...${NC}"
if [ -d "backend/user-service/node_modules" ]; then
    echo -e "${GREEN}✓${NC} user-service dependencies installed"
else
    echo -e "${YELLOW}⚠${NC}  user-service dependencies not installed (run: cd backend/user-service && npm install)"
    ((WARNINGS++))
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} frontend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC}  frontend dependencies not installed (run: cd frontend && npm install)"
    ((WARNINGS++))
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                        Summary                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! You're ready to start the application.${NC}"
    echo ""
    echo -e "${BLUE}To start the services:${NC}"
    echo -e "  ${GREEN}docker-compose up${NC}     # or"
    echo -e "  ${GREEN}docker-compose up --build${NC}  # to rebuild"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Configuration complete with $WARNINGS warning(s).${NC}"
    echo -e "  Review the warnings above. The application should still work."
    echo ""
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS error(s) and $WARNINGS warning(s).${NC}"
    echo -e "  Please fix the errors above before starting the application."
    echo ""
    echo -e "${BLUE}Quick fixes:${NC}"
    echo -e "  1. Copy example files: ${GREEN}cp backend/user-service/.env.example backend/user-service/.env${NC}"
    echo -e "  2. Copy example files: ${GREEN}cp frontend/.env.example frontend/.env${NC}"
    echo -e "  3. Update Google OAuth credentials in both .env files"
    echo -e "  4. See ${GREEN}GOOGLE_OAUTH_SETUP.md${NC} for detailed setup instructions"
    echo ""
    exit 1
fi
