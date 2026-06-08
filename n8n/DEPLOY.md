# Despliegue n8n — WhatsApp Dashboard

n8n: https://primary-production-b7ae.up.railway.app

## Workflows desplegados (activos)
| Workflow | ID | Webhook (producción) |
|---|---|---|
| WA · Incoming (Meta) | GHs0GyJLj6YZMT2a | `/webhook/wa-incoming` (GET verify + POST mensajes) |
| WA · Send Message | Sw4OERszWK43Ra2N | `/webhook/wa-send` (POST) |
| WA · Get Conversations | hFnujBOqdNAFjiXA | `/webhook/wa-conversations` (GET) |
| WA · Get Messages | jG87Czw3OAhA6CCg | `/webhook/wa-messages` (GET) |
| WA · DB Setup | R1VYzFowxtfihDNb | `/webhook/wa-db-setup` (GET, un solo uso) |

## Credenciales
- Postgres (n8n): `ugbph1jdfP34lfPg` — lee de $env (WA_PGHOST/DATABASE/USER/PASSWORD)
- WhatsApp Business Cloud: `ULnicJG1cKVoq6dg` — Phone Number ID `1117263431478161`

## Variables de entorno requeridas en el servicio n8n (Railway)
```
N8N_BLOCK_ENV_ACCESS_IN_NODE = false   # CRÍTICO: desbloquea $env en nodos/credenciales
WA_PGHOST      = ${{Postgres.PGHOST}}
WA_PGDATABASE  = ${{Postgres.PGDATABASE}}
WA_PGUSER      = ${{Postgres.PGUSER}}
WA_PGPASSWORD  = ${{Postgres.PGPASSWORD}}
WA_VERIFY_TOKEN = <define-un-token-en-railway>   # NO commitear el valor real
```

## Pasos pendientes
1. Crear servicio Postgres en el mismo proyecto de Railway.
2. Añadir las 6 variables al servicio n8n (n8n se redespliega solo).
3. Ejecutar DB Setup: GET /webhook/wa-db-setup (crea las tablas).
4. Configurar webhook en Meta: callback `/webhook/wa-incoming`, verify token = WA_VERIFY_TOKEN, suscribir campo `messages`.
5. Dashboard → Ajustes → modo LIVE, pegar las 3 URLs.
