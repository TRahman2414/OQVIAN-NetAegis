# NetAegis

A self-hosted ISP security operations demo combining Wazuh, a custom dashboard and a local model integration.

**Current status:** the first local dashboard and fixture-only backend slice is running, including a multi-server inventory preview. Dashboard actions use the backend when available; incidents, server entries and workflow actions remain synthetic and simulated. The n8n event contract is documented for the separate workflow build. Wazuh, the local model and real notification workflows are not connected; this demo does not monitor networks or send messages.

## Run the dashboard preview

Requires Node.js 18+. From this directory, run:

```bash
node backend/server.js
```

Open <http://127.0.0.1:4173>. Stop the server with Ctrl+C. The UI and API use the same loopback origin. Incident actions are stored by the local demo process; restart the server or use **Reset demo** to restore fixture state. This is synthetic demo data only.

## Planned system

The next phases will add a verified read-only Wazuh adapter that can represent a growing Wazuh-agent fleet, plus a connector for the customer's separately supplied trained local model. The NetAegis project does not train the model; it will call the configured local model API and show its status and analysis coverage. Practical server capacity depends on the customer deployment's resources. Notification workflows are documented in [docs/n8n-contract.md](docs/n8n-contract.md) for separate n8n implementation. Public demo mode will continue to use synthetic data, and notification actions remain simulated. See the [master plan](MASTER_PLAN.md) for architecture, role boundaries and acceptance criteria.
