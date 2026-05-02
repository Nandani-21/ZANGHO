import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Flex, Text, Button, Input, VStack, HStack, Avatar, Divider, Heading, Badge,
  useColorModeValue, IconButton, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, Textarea, useDisclosure, Popover,
  PopoverTrigger, PopoverContent, PopoverHeader, PopoverBody, PopoverArrow,
  PopoverCloseButton, InputGroup, InputRightElement, FormControl, FormLabel
} from '@chakra-ui/react';
import { FiArrowLeft, FiSend, FiFileText, FiMic } from 'react-icons/fi';
import { getConversation, interveneInConversation, releaseIntervention, addMessage } from '../api';
import { useSupervisor } from '../context/SupervisorContext';

const ConversationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { conversations, templates, ws } = useSupervisor();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isIntervening, setIsIntervening] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isVarOpen, onOpen: onVarOpen, onClose: onVarClose } = useDisclosure();
  const messagesEndRef = useRef(null);

  const [templateVars, setTemplateVars] = useState([]);
  const [templateValues, setTemplateValues] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchConv = async () => {
      try {
        const data = await getConversation(id);
        setConversation(data);
        setMessages(data.messages || []);
        setIsIntervening(data.status === 'escalated' || data.isIntervened);
      } catch (err) {
        console.error("Error fetching conversation", err);
      }
    };
    fetchConv();
  }, [id]);

  useEffect(() => {
    const activeConv = conversations.find(c => c.id === id);
    if (activeConv && activeConv.messages) {
      setMessages(activeConv.messages);
    }
  }, [conversations, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTakeOver = async () => {
    try {
      await interveneInConversation(id, 'supervisor-1', 'Taking over manually');
      setIsIntervening(true);
    } catch (err) {
      console.error('Failed to take over', err);
    }
  };

  const handleRelease = async () => {
    try {
      await releaseIntervention(id, releaseNotes);
      setIsIntervening(false);
      onClose();
      setReleaseNotes('');
    } catch (err) {
      console.error('Failed to release', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    try {
      const newMsg = {
        sender: 'supervisor',
        text: inputMessage,
        timestamp: new Date().toISOString()
      };
      await addMessage(id, newMsg);
      setInputMessage('');
      
      // Send over WS if possible or rely on REST
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'send_message', conversationId: id, message: newMsg }));
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const insertTemplate = (text) => {
    let newText = text;
    if (conversation?.customer?.name) {
      newText = newText.replace(/\{\{name\}\}/g, conversation.customer.name);
    }
    setInputMessage(prev => prev + (prev ? ' ' : '') + newText);
  };

  const handleTemplateClick = (text) => {
    const matches = text.match(/{{(.*?)}}/g);
    if (matches && matches.length > 0) {
      const vars = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
      setTemplateVars(vars);
      setTemplateValues({});
      setSelectedTemplate(text);
      onVarOpen();
    } else {
      insertTemplate(text);
    }
  };

  const handleApplyVariables = () => {
    let parsedText = selectedTemplate;
    templateVars.forEach(v => {
      const val = templateValues[v] || `{{${v}}}`;
      parsedText = parsedText.replace(new RegExp(`{{${v}}}`, 'g'), val);
    });
    insertTemplate(parsedText);
    onVarClose();
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    
    recognition.start();
  };

  const hasSpeechSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  if (!conversation) return <Box p={4}>Loading...</Box>;

  return (
    <Box h="calc(100vh - 100px)" display="flex" flexDirection="column">
      <Flex justify="space-between" align="center" bg={bg} p={4} borderBottom="1px" borderColor={border}>
        <Flex align="center">
          <IconButton icon={<FiArrowLeft />} mr={4} onClick={() => navigate('/')} variant="ghost" />
          <Box>
            <Heading size="md">{conversation.customer?.name || 'Unknown Customer'}</Heading>
            <Badge colorScheme={conversation.status === 'active' ? 'green' : 'orange'}>
              {conversation.status}
            </Badge>
          </Box>
        </Flex>
        {isIntervening ? (
          <Button colorScheme="blue" onClick={onOpen}>Return Control</Button>
        ) : (
          <Button colorScheme="red" onClick={handleTakeOver}>Take Over</Button>
        )}
      </Flex>

      <Box flex={1} overflowY="auto" p={4} bg="gray.50" _dark={{ bg: 'gray.900' }}>
        <VStack spacing={4} align="stretch" data-testid="message-list">
          {messages.map((msg, idx) => {
            const isCustomer = msg.sender === 'customer';
            const isAI = msg.sender === 'agent' || msg.sender === 'ai';
            const isSupervisor = msg.sender === 'supervisor';

            let bgCol = 'white';
            let align = 'flex-start';
            if (isCustomer) { bgCol = 'blue.100'; align = 'flex-end'; }
            if (isSupervisor) { bgCol = 'green.100'; align = 'flex-end'; }

            return (
              <Flex key={idx} justify={align === 'flex-end' ? 'flex-end' : 'flex-start'}>
                <Box maxW="70%" bg={bgCol} p={3} borderRadius="md" boxShadow="sm" color="black">
                  <Text fontWeight="bold" fontSize="xs" mb={1} color="gray.600">
                    {isCustomer ? conversation.customer.name : isSupervisor ? 'You' : 'AI Agent'}
                  </Text>
                  <Text fontSize="sm">{msg.text}</Text>
                </Box>
              </Flex>
            );
          })}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {isIntervening && (
        <Flex p={4} bg={bg} borderTop="1px" borderColor={border} align="center">
          <Popover placement="top-start">
            <PopoverTrigger>
              <IconButton icon={<FiFileText />} mr={2} title="Use Template" />
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader fontWeight="bold">Templates</PopoverHeader>
              <PopoverBody maxH="200px" overflowY="auto">
                {templates.length === 0 ? <Text fontSize="sm">No templates found.</Text> : (
                  <VStack align="stretch">
                    {templates.map(t => (
                      <Button key={t.id} size="sm" variant="ghost" onClick={() => handleTemplateClick(t.body)} justifyContent="flex-start">
                        {t.name}
                      </Button>
                    ))}
                  </VStack>
                )}
              </PopoverBody>
            </PopoverContent>
          </Popover>
          <InputGroup mr={2}>
            <Input 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            {hasSpeechSupport && (
              <InputRightElement>
                <IconButton 
                  icon={<FiMic />} 
                  size="sm" 
                  variant="ghost" 
                  color={isRecording ? "red.500" : "gray.500"} 
                  onClick={startVoiceInput} 
                  aria-label="Voice Input" 
                  isDisabled={isRecording}
                />
              </InputRightElement>
            )}
          </InputGroup>
          <IconButton icon={<FiSend />} colorScheme="blue" onClick={handleSendMessage} />
        </Flex>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Return Control to AI</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>Provide notes or guidance for the AI agent to resume the conversation:</Text>
            <Textarea 
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="E.g., I've resolved the billing issue, just ask if they need anything else."
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleRelease}>Confirm Return</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isVarOpen} onClose={onVarClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Fill Template Variables</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {templateVars.map(v => (
                <FormControl key={v}>
                  <FormLabel>{v.replace(/_/g, ' ')}</FormLabel>
                  <Input 
                    value={templateValues[v] || ''} 
                    onChange={(e) => setTemplateValues(prev => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`Enter value for ${v}`}
                  />
                </FormControl>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onVarClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleApplyVariables}>Insert Template</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ConversationView;
