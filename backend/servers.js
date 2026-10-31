/*
 * OQVIAN NetAegis synthetic multi-server inventory for the public demo.
 * These are fictional Wazuh-agent examples, not connected hosts.
 * The array has no product-side item limit; deployment capacity is defined
 * by the customer's Wazuh infrastructure and model-serving resources.
 */

"use strict";

const SERVERS = [
  {
    id: "SRV-001",
    name: "core-mgmt-01",
    platform: "Ubuntu Server 24.04",
    site: "North demo site",
    agentStatus: "Fixture only",
    modelStatus: "Preview only",
    lastEvent: "Authentication abuse · NET-1042",
  },
  {
    id: "SRV-002",
    name: "edge-router-03",
    platform: "Network appliance",
    site: "West demo site",
    agentStatus: "Fixture only",
    modelStatus: "Preview only",
    lastEvent: "Configuration change · NET-1041",
  },
  {
    id: "SRV-003",
    name: "lab-endpoint-07",
    platform: "Windows Server 2022",
    site: "Lab demo site",
    agentStatus: "Fixture only",
    modelStatus: "Preview only",
    lastEvent: "Suspicious process · NET-1040",
  },
];

module.exports = { SERVERS };
