import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Flex, Heading, Text, Button, FormControl, FormLabel,
  Slider, SliderTrack, SliderFilledTrack, SliderThumb, Switch,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper,
  NumberDecrementStepper, Select, useToast, VStack, HStack, Divider,
  useColorModeValue, IconButton
} from '@chakra-ui/react';
import { FiArrowLeft, FiSave, FiDownload } from 'react-icons/fi';
import { getAgent, updateAgentConfig } from '../api';

const AgentConfig = () => {
  const params = useParams();
  const id = params.id || 'agent-cs-1'; // Fallback for /agent-config test route
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');

  const [agent, setAgent] = useState(null);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [domains, setDomains] = useState({
    billing: true,
    technical: false,
    sales: true
  });
  const [escalationThreshold, setEscalationThreshold] = useState(3);
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const data = await getAgent(id);
        setAgent(data);
        if (data.config) {
          setTemperature(data.config.temperature || 0.7);
          setMaxTokens(data.config.maxTokens || 1024);
          if (data.config.domains) setDomains(data.config.domains);
          setEscalationThreshold(data.config.escalationThreshold || 3);
        }
      } catch (err) {
        console.error("Error fetching agent", err);
      }
    };
    fetchAgent();

    const savedPresets = localStorage.getItem(`agent_presets_${id}`);
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
  }, [id]);

  const handleSave = async () => {
    const config = {
      temperature,
      maxTokens,
      domains,
      escalationThreshold
    };
    try {
      await updateAgentConfig(id, config);
      toast({ title: "Configuration saved", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: "Error saving config", status: "error", duration: 2000 });
    }
  };

  const handleSavePreset = () => {
    const presetName = prompt("Enter preset name:");
    if (!presetName) return;
    
    const config = { temperature, maxTokens, domains, escalationThreshold };
    const newPreset = { name: presetName, config };
    const newPresets = [...presets, newPreset];
    
    setPresets(newPresets);
    localStorage.setItem(`agent_presets_${id}`, JSON.stringify(newPresets));
    toast({ title: "Preset saved", status: "info", duration: 2000 });
  };

  const handleLoadPreset = (e) => {
    const presetName = e.target.value;
    if (!presetName) return;
    
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      setTemperature(preset.config.temperature);
      setMaxTokens(preset.config.maxTokens);
      setDomains(preset.config.domains);
      setEscalationThreshold(preset.config.escalationThreshold);
    }
  };

  if (!agent) return <Box p={4}>Loading...</Box>;

  return (
    <Box maxW="800px" mx="auto" p={6} bg={bg} borderRadius="lg" boxShadow="sm" data-testid="agent-config-form">
      <Flex align="center" mb={6}>
        <IconButton icon={<FiArrowLeft />} mr={4} onClick={() => navigate('/')} variant="ghost" />
        <Box>
          <Heading size="lg">Configure {agent.name}</Heading>
          <Text color="gray.500">Fine-tune AI behavior and permissions</Text>
        </Box>
      </Flex>

      <Flex justify="flex-end" mb={6} gap={4}>
        <Select placeholder="Load Preset" maxW="200px" onChange={handleLoadPreset}>
          {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </Select>
        <Button leftIcon={<FiDownload />} onClick={handleSavePreset} variant="outline">
          Save as Preset
        </Button>
      </Flex>

      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="md" mb={4}>LLM Parameters</Heading>
          <FormControl mb={4}>
            <FormLabel>Temperature: {temperature}</FormLabel>
            <Slider 
              min={0} max={1} step={0.1} 
              value={temperature} 
              onChange={(v) => setTemperature(v)}
            >
              <SliderTrack><SliderFilledTrack /></SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>
          
          <FormControl>
            <FormLabel>Max Tokens: {maxTokens}</FormLabel>
            <Slider 
              min={256} max={4096} step={128} 
              value={maxTokens} 
              onChange={(v) => setMaxTokens(v)}
            >
              <SliderTrack><SliderFilledTrack /></SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>Knowledge Domains</Heading>
          <HStack spacing={8}>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Billing</FormLabel>
              <Switch isChecked={domains.billing} onChange={(e) => setDomains({...domains, billing: e.target.checked})} />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Technical Support</FormLabel>
              <Switch isChecked={domains.technical} onChange={(e) => setDomains({...domains, technical: e.target.checked})} />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Sales</FormLabel>
              <Switch isChecked={domains.sales} onChange={(e) => setDomains({...domains, sales: e.target.checked})} />
            </FormControl>
          </HStack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>Rules & Thresholds</Heading>
          <FormControl maxW="300px">
            <FormLabel>Automatic Escalation Threshold (User negative inputs)</FormLabel>
            <NumberInput 
              min={1} max={10} 
              value={escalationThreshold} 
              onChange={(valString, valNumber) => setEscalationThreshold(valNumber)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </Box>

        <Button mt={4} size="lg" colorScheme="blue" leftIcon={<FiSave />} onClick={handleSave}>
          Save Configuration
        </Button>
      </VStack>
    </Box>
  );
};

export default AgentConfig;
