import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '@context/index';
import logger from '@utils/logger';

const ProtectedRoute = ({ children }) => {
  const { auth } = useContext(AuthContext);
  const isAuthed = auth && auth.token;
  if (!isAuthed) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
