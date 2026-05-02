// src/app.js
import React from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import theme from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AgentConfig from './pages/AgentConfig';
import ConversationView from './pages/ConversationView';
import Analysis from './pages/Analysis';
import Templates from './pages/Templates';
import { SupervisorProvider } from './context/SupervisorContext';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <SupervisorProvider>
        <Router>
          <Box minHeight="100vh">
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/conversation/:id" element={<ConversationView />} />
                <Route path="/agents/:id/config" element={<AgentConfig />} />
                <Route path="/agent-config" element={<AgentConfig />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/Analysis" element={<Analysis/>} />
              </Routes>
            </Layout>
          </Box>
        </Router>
      </SupervisorProvider>
    </ChakraProvider>
  );
}

export default App;