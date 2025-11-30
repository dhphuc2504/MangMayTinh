// Quản lý map webClients ↔ agents, lookup khi relay
// lưu socket & agentId

const connectionManager = {
    // Maps lưu socket
    webClients: new Map(),   // key: clientId, value: { socket, agentId }
    agents: new Map(),       // key: agentId, value: { socket, assignedWebClients: Set<clientId> }
  
    // --- Web Client ---
    addWebClient(clientId, socket) {
      this.webClients.set(clientId, { socket, agentId: null });
    },
  
    removeWebClient(clientId) {
      const client = this.webClients.get(clientId);
      if (client && client.agentId) {
        // Xóa mapping từ agent
        const agent = this.agents.get(client.agentId);
        if (agent) {
          agent.assignedWebClients.delete(clientId);
        }
      }
      this.webClients.delete(clientId);
    },
  
    assignAgentToWebClient(clientId, agentId) {
      const client = this.webClients.get(clientId);
      const agent = this.agents.get(agentId);
      if (!client || !agent) return false;
  
      client.agentId = agentId;
      agent.assignedWebClients.add(clientId);
      return true;
    },
  
    getWebClientSocket(clientId) {
      const client = this.webClients.get(clientId);
      return client ? client.socket : null;
    },
  
    getWebClientAgentId(clientId) {
      const client = this.webClients.get(clientId);
      return client ? client.agentId : null;
    },
  
    // --- Agent ---
    addAgent(agentId, socket) {
      this.agents.set(agentId, { socket, assignedWebClients: new Set() });
    },
  
    removeAgent(agentId) {
      const agent = this.agents.get(agentId);
      if (agent) {
        // Xóa mapping từ các web client
        for (const clientId of agent.assignedWebClients) {
          const client = this.webClients.get(clientId);
          if (client) client.agentId = null;
        }
      }
      this.agents.delete(agentId);
    },
  
    getAgentSocket(agentId) {
      const agent = this.agents.get(agentId);
      return agent ? agent.socket : null;
    },
  
    getAssignedWebClients(agentId) {
      const agent = this.agents.get(agentId);
      return agent ? Array.from(agent.assignedWebClients) : [];
    },
  
    // --- Utility ---
    isWebClientConnected(clientId) {
      return this.webClients.has(clientId);
    },
  
    isAgentConnected(agentId) {
      return this.agents.has(agentId);
    }
  };
  
  module.exports = connectionManager;