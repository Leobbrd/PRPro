#!/bin/bash

# PRPro Database Setup Script
set -e

echo "🚀 PRPro Database Setup Script"
echo "================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
        echo "   Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
        echo "   Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
}

# Check if .env.local exists
check_env_file() {
    if [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}⚠️  .env.local not found. Creating from .env.example...${NC}"
        cp .env.example .env.local
        echo -e "${BLUE}📝 Please edit .env.local with your actual configuration${NC}"
    else
        echo -e "${GREEN}✅ .env.local found${NC}"
    fi
}

# Start databases
start_databases() {
    echo -e "${BLUE}🐘 Starting PostgreSQL and Redis...${NC}"
    docker-compose up -d postgres redis
    
    echo -e "${BLUE}⏳ Waiting for databases to be ready...${NC}"
    
    # Wait for PostgreSQL
    echo -n "Waiting for PostgreSQL"
    while ! docker-compose exec postgres pg_isready -U prpro_user -d prpro -q; do
        echo -n "."
        sleep 1
    done
    echo -e "\n${GREEN}✅ PostgreSQL is ready${NC}"
    
    # Wait for Redis
    echo -n "Waiting for Redis"
    while ! docker-compose exec redis redis-cli ping | grep -q "PONG"; do
        echo -n "."
        sleep 1
    done
    echo -e "\n${GREEN}✅ Redis is ready${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Setup Prisma
setup_prisma() {
    echo -e "${BLUE}🗄️  Setting up Prisma...${NC}"
    
    # Generate Prisma client
    echo "Generating Prisma client..."
    npx prisma generate
    
    # Push database schema
    echo "Pushing database schema..."
    npx prisma db push
    
    # Seed database
    echo "Seeding database with demo data..."
    npx prisma db seed
    
    echo -e "${GREEN}✅ Prisma setup completed${NC}"
}

# Test database connections
test_connections() {
    echo -e "${BLUE}🔧 Testing database connections...${NC}"
    
    # Test PostgreSQL connection
    if docker-compose exec postgres pg_isready -U prpro_user -d prpro -q; then
        echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"
    else
        echo -e "${RED}❌ PostgreSQL connection failed${NC}"
        exit 1
    fi
    
    # Test Redis connection
    if docker-compose exec redis redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✅ Redis connection successful${NC}"
    else
        echo -e "${RED}❌ Redis connection failed${NC}"
        exit 1
    fi
}

# Show access information
show_access_info() {
    echo -e "\n${GREEN}🎉 Database setup completed successfully!${NC}"
    echo -e "\n${BLUE}Access Information:${NC}"
    echo "================================"
    echo "🐘 PostgreSQL:"
    echo "   Host: localhost:5432"
    echo "   Database: prpro"
    echo "   Username: prpro_user"
    echo "   Password: prpro_password"
    echo ""
    echo "🔴 Redis:"
    echo "   Host: localhost:6379"
    echo "   No authentication required"
    echo ""
    echo "🌐 Adminer (Database UI):"
    echo "   URL: http://localhost:8080"
    echo "   System: PostgreSQL"
    echo "   Server: postgres"
    echo "   Username: prpro_user"
    echo "   Password: prpro_password"
    echo "   Database: prpro"
    echo ""
    echo "👤 Demo Accounts:"
    echo "   Admin: admin@prpro.com / admin123456"
    echo "   User: demo@example.com / user123456"
    echo "   Media: media@example.com / user123456"
    echo ""
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo "1. Update .env.local with your actual configuration"
    echo "2. Run 'npm run dev' to start the application"
    echo "3. Visit http://localhost:3000 to access the application"
    echo ""
    echo -e "${BLUE}💡 Useful Commands:${NC}"
    echo "   npm run docker:up     - Start all services"
    echo "   npm run docker:down   - Stop all services"
    echo "   npm run db:studio     - Open Prisma Studio"
    echo "   npm run db:reset      - Reset database"
}

# Main execution
main() {
    check_docker
    check_env_file
    install_dependencies
    start_databases
    setup_prisma
    test_connections
    show_access_info
}

# Run main function
main