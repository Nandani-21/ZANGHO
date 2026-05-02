import React, { useState } from 'react';
import {
  Box, Flex, Heading, Text, Button, Table, Thead, Tbody, Tr, Th, Td,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Textarea, useDisclosure, useColorModeValue, IconButton,
  HStack, Tag, Select, Checkbox, Badge
} from '@chakra-ui/react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useSupervisor } from '../context/SupervisorContext';

const Templates = () => {
  const { templates, addTemplate, deleteTemplate } = useSupervisor();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bg = useColorModeValue('white', 'gray.800');

  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('General');
  const [newTemplateShared, setNewTemplateShared] = useState(false);

  const handleSave = () => {
    if (newTemplateName.trim() && newTemplateBody.trim()) {
      addTemplate({ 
        name: newTemplateName, 
        body: newTemplateBody,
        category: newTemplateCategory,
        shared: newTemplateShared
      });
      setNewTemplateName('');
      setNewTemplateBody('');
      setNewTemplateCategory('General');
      setNewTemplateShared(false);
      onClose();
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Message Templates</Heading>
          <Text color="gray.500">Manage quick-reply templates for supervisor interventions.</Text>
        </Box>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
          Create Template
        </Button>
      </Flex>

      <Box bg={bg} p={4} borderRadius="lg" boxShadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Body (Preview)</Th>
              <Th>Shared</Th>
              <Th width="100px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {templates.length === 0 ? (
              <Tr>
                <Td colSpan={3} textAlign="center" color="gray.500">No templates found. Create one above.</Td>
              </Tr>
            ) : (
              templates.map(t => (
                <Tr key={t.id}>
                  <Td fontWeight="bold">{t.name}</Td>
                  <Td>
                    <Badge colorScheme="blue">{t.category || 'General'}</Badge>
                  </Td>
                  <Td>
                    <Text noOfLines={2} fontSize="sm">{t.body}</Text>
                  </Td>
                  <Td>
                    {t.shared ? <Badge colorScheme="green">Yes</Badge> : <Badge colorScheme="gray">No</Badge>}
                  </Td>
                  <Td>
                    <IconButton 
                      icon={<FiTrash2 />} 
                      colorScheme="red" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteTemplate(t.id)}
                      aria-label="Delete template"
                    />
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Template</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel>Template Name</FormLabel>
              <Input 
                value={newTemplateName} 
                onChange={(e) => setNewTemplateName(e.target.value)} 
                placeholder="e.g., Greeting, Apology..." 
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Category</FormLabel>
              <Select 
                value={newTemplateCategory} 
                onChange={(e) => setNewTemplateCategory(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Shipping">Shipping</option>
                <option value="Returns">Returns</option>
                <option value="Billing">Billing</option>
                <option value="Technical Support">Technical Support</option>
              </Select>
            </FormControl>
            <FormControl mb={4}>
              <Checkbox 
                isChecked={newTemplateShared} 
                onChange={(e) => setNewTemplateShared(e.target.checked)}
              >
                Share with team
              </Checkbox>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Template Body</FormLabel>
              <Textarea 
                value={newTemplateBody} 
                onChange={(e) => setNewTemplateBody(e.target.value)} 
                placeholder="Type your message here... Use {{variable_name}} for dynamic values." 
                rows={5}
              />
            </FormControl>
            <Box mt={3} p={3} bg="blue.50" _dark={{ bg: 'blue.900' }} borderRadius="md">
              <Text fontSize="sm" fontWeight="bold" mb={2}>Available Variables:</Text>
              <HStack spacing={2} flexWrap="wrap">
                <Tag colorScheme="blue" mb={2}>{"{{customer_name}}"}</Tag>
                <Tag colorScheme="blue" mb={2}>{"{{order_number}}"}</Tag>
                <Tag colorScheme="blue" mb={2}>{"{{issue_type}}"}</Tag>
              </HStack>
              <Text fontSize="xs" mt={2} color="gray.600" _dark={{ color: 'gray.300' }}>
                You can use {'{{variable_name}}'} in the body text (e.g., Hello {'{{customer_name}}'}, how can I help?). During intervention, you will be prompted to fill these in before sending.
              </Text>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSave}>Save Template</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Templates;
