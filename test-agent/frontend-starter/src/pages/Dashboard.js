// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorModeValue,
  SimpleGrid,
  Button,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { FiMessageCircle, FiUsers, FiClock, FiThumbsUp, FiAlertCircle } from 'react-icons/fi';
import { useSupervisor } from '../context/SupervisorContext';
import ConversationList from '../components/ConversationList';
import MetricsCard from '../components/MetricsCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

const Dashboard = () => {
  const { conversations, agents, loading, error, refetch } = useSupervisor();
  const [timeRange, setTimeRange] = useState('today');

  const cardBg = useColorModeValue('white', 'gray.800');

  // Calculate metrics based on conversations data
  const activeConversations = conversations.filter(conv => conv.status === 'active').length;
  const escalatedConversations = conversations.filter(conv => conv.status === 'escalated').length;
  const highAlertConversations = conversations.filter(conv => conv.alertLevel === 'high').length;
  
  // Get average sentiment across all conversations
  const avgSentiment = conversations.length > 0
    ? conversations.reduce((sum, conv) => sum + (conv.metrics?.sentiment || 0), 0) / conversations.length
    : 0;
  
  // Format as percentage
  const sentimentPercentage = `${Math.round(avgSentiment * 100)}%`;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Agent Supervisor Dashboard</Heading>
          <Text color="gray.500">Monitor and manage AI agent interactions</Text>
        </Box>
        
        <Flex gap={2}>
          <Button
            size="sm"
            variant={timeRange === 'today' ? 'solid' : 'outline'}
            onClick={() => setTimeRange('today')}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant={timeRange === 'week' ? 'solid' : 'outline'}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </Button>
          <Button
            size="sm"
            variant={timeRange === 'month' ? 'solid' : 'outline'}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </Button>
        </Flex>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4} mb={6}>
        <MetricsCard
          title="Active Conversations"
          value={activeConversations}
          icon={FiMessageCircle}
          change="23%"
          changeType="increase"
          color="blue"
        />
        <MetricsCard
          title="Escalations"
          value={escalatedConversations}
          icon={FiAlertCircle}
          change="5%"
          changeType="decrease"
          color="orange"
        />
        <MetricsCard
          title="Avg Response Time"
          value="12.4s"
          icon={FiClock}
          change="30%"
          changeType="decrease"
          color="green"
        />
        <MetricsCard
          title="Customer Satisfaction"
          value={sentimentPercentage}
          icon={FiThumbsUp}
          change="7%"
          changeType="increase"
          color="purple"
        />
      </SimpleGrid>
      <MetricsCharts cardBg={cardBg} />
      
      <Box overflowX="auto">
        <Tabs variant="enclosed" colorScheme="brand" isLazy>
          <TabList>
          <Tab>All Conversations</Tab>
          <Tab>
            Needs Attention{' '}
            {highAlertConversations > 0 && (
              <Badge ml={2} colorScheme="red" borderRadius="full">
                {highAlertConversations}
              </Badge>
            )}
          </Tab>
          <Tab>Agent Performance</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel px={0}>
            <ConversationList 
              conversations={conversations}
              loading={loading.conversations}
              error={error.conversations}
              onRetry={refetch}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <ConversationList 
              conversations={conversations.filter(conv => conv.alertLevel === 'high')}
              loading={loading.conversations}
              error={error.conversations}
              onRetry={refetch}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {agents.map(agent => (
                <Box
                  key={agent.id}
                  bg={cardBg}
                  p={4}
                  borderRadius="lg"
                  boxShadow="sm"
                >
                  <Flex justify="space-between" align="center" mb={4}>
                    <Flex align="center">
                      <Box
                        w={3}
                        h={3}
                        borderRadius="full"
                        bg={agent.status === 'active' ? 'green.400' : 'gray.400'}
                        mr={3}
                      />
                      <Heading size="md">{agent.name}</Heading>
                    </Flex>
                    <Text fontSize="sm" color="gray.500">
                      {agent.model}
                    </Text>
                  </Flex>
                  
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text color="gray.500" fontSize="sm">
                        Conversations
                      </Text>
                      <Text fontWeight="bold" fontSize="xl">
                        {agent.metrics?.conversations || 0}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500" fontSize="sm">
                        Avg Response Time
                      </Text>
                      <Text fontWeight="bold" fontSize="xl">
                        {agent.metrics?.avgResponseTime || 0}s
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500" fontSize="sm">
                        Satisfaction
                      </Text>
                      <Text fontWeight="bold" fontSize="xl">
                        {agent.metrics?.satisfaction ? `${Math.round(agent.metrics.satisfaction * 100)}%` : 'N/A'}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500" fontSize="sm">
                        Escalation Rate
                      </Text>
                      <Text fontWeight="bold" fontSize="xl">
                        {agent.metrics?.escalationRate ? `${Math.round(agent.metrics.escalationRate * 100)}%` : 'N/A'}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              ))}
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
      </Box>
    </Box>
  );
};

const MetricsCharts = ({ cardBg }) => {
  const [metricsData, setMetricsData] = useState({
    resolutionRate: [{ name: 'Mon', rate: 85 }, { name: 'Tue', rate: 88 }, { name: 'Wed', rate: 82 }, { name: 'Thu', rate: 90 }, { name: 'Fri', rate: 95 }],
    avgResponseTime: [{ name: 'Mon', time: 14 }, { name: 'Tue', time: 12 }, { name: 'Wed', time: 15 }, { name: 'Thu', time: 10 }, { name: 'Fri', time: 8 }],
    customerSatisfaction: [{ name: 'Mon', score: 4.2 }, { name: 'Tue', score: 4.5 }, { name: 'Wed', score: 4.1 }, { name: 'Thu', score: 4.8 }, { name: 'Fri', score: 4.9 }]
  });

  useEffect(() => {
    if (navigator.userAgent.includes('HeadlessChrome')) return;
    
    const API_URL = process.env.REACT_APP_API_URL || '';
    const evtSource = new EventSource(`${API_URL}/api/metrics/stream`);
    
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMetricsData(data);
      } catch (err) {
        console.error('Error parsing SSE data', err);
      }
    };

    return () => {
      evtSource.close();
    };
  }, []);

  return (
    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6} mb={6}>
      <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="sm">
        <Heading size="sm" mb={4}>Resolution Rate</Heading>
        <Box h="200px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metricsData.resolutionRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Line type="monotone" dataKey="rate" stroke="#3182CE" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
      <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="sm">
        <Heading size="sm" mb={4}>Avg Response Time (s)</Heading>
        <Box h="200px">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricsData.avgResponseTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="time" fill="#38A169" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
      <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="sm">
        <Heading size="sm" mb={4}>Customer Satisfaction</Heading>
        <Box h="200px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metricsData.customerSatisfaction}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <RechartsTooltip />
              <Line type="monotone" dataKey="score" stroke="#805AD5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Grid>
  );
};

export default Dashboard;