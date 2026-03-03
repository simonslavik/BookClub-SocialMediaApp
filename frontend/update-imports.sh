#!/bin/bash

# Script to update all import paths in React project

echo "Updating import paths..."

# Update HomePageHeader to Header in layout
find /Users/simonslavik/Desktop/Portfolio-Microservices/try/react-project/src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' \
  -e "s|from '../../components/HomePageHeader'|from '../../components/layout/Header'|g" \
  -e "s|from '../../../components/HomePageHeader'|from '../../../components/layout/Header'|g" \
  -e "s|from '@/components/HomePageHeader'|from '@/components/layout/Header'|g" \
  -e "s|from './components/HomePageHeader'|from './components/layout/Header'|g" \
  {} +

# Update ProtectedRoute
find /Users/simonslavik/Desktop/Portfolio-Microservices/try/react-project/src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' \
  -e "s|from '../../components/ProtectedRoute'|from '../../components/common/ProtectedRoute'|g" \
  -e "s|from '../components/ProtectedRoute'|from '../components/common/ProtectedRoute'|g" \
  -e "s|from '@/components/ProtectedRoute'|from '@/components/common/ProtectedRoute'|g" \
  {} +

# Update SearchBookComponent
find /Users/simonslavik/Desktop/Portfolio-Microservices/try/react-project/src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' \
  -e "s|from '../../components/SearchBookComponent'|from '../../components/features/search/SearchBookComponent'|g" \
  -e "s|from '../../../components/SearchBookComponent'|from '../../../components/features/search/SearchBookComponent'|g" \
  -e "s|from '@/components/SearchBookComponent'|from '@/components/features/search/SearchBookComponent'|g" \
  {} +

# Update Modals path
find /Users/simonslavik/Desktop/Portfolio-Microservices/try/react-project/src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' \
  -e "s|from '../../components/Modals/|from '../../components/common/modals/|g" \
  -e "s|from '../../../components/Modals/|from '../../../components/common/modals/|g" \
  -e "s|from '@/components/Modals/|from '@/components/common/modals/|g" \
  {} +

# Update BookClub components path
find /Users/simonslavik/Desktop/Portfolio-Microservices/try/react-project/src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' \
  -e "s|from '../../components/BookClub/|from '../../components/features/bookclub/|g" \
  -e "s|from '../../../components/BookClub/|from '../../../components/features/bookclub/|g" \
  -e "s|from '@/components/BookClub/|from '@/components/features/bookclub/|g" \
  {} +

# Update common components
for comp in FileUpload FileExplorer MessageAttachment SideBarDm UserPresence; do
  find /Users/simonslavik/Desktop/Portfolio-Microservices/try/react-project/src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' \
    -e "s|from '../../components/${comp}'|from '../../components/common/${comp}'|g" \
    -e "s|from '../../../components/${comp}'|from '../../../components/common/${comp}'|g" \
    -e "s|from '@/components/${comp}'|from '@/components/common/${comp}'|g" \
    {} +
done

# Update page routes (remove :id from folder names)
find /Users/simonslavik/Desktop/Portfolio-Microservices/try/react-project/src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' \
  -e "s|from '../pages/bookclub/|from '../pages/BookClub/|g" \
  -e "s|from '../pages/bookclubPage/|from '../pages/BookClubDetails/|g" \
  -e "s|from '../pages/changeProfile/|from '../pages/ChangeProfile/|g" \
  -e "s|from '../pages/createbookclub/|from '../pages/CreateBookClub/|g" \
  -e "s|from '../pages/discover/|from '../pages/Discover/|g" \
  -e "s|from '../pages/home/|from '../pages/Home/|g" \
  -e "s|from '../pages/invite/|from '../pages/Invite/|g" \
  -e "s|from '../pages/profilePage/|from '../pages/Profile/|g" \
  {} +

echo "Import paths updated successfully!"
