# Flash Sale Stock Reservation System - Architecture Documentation

## Expiration System
- 10-minute reservation window (configurable)
-Background cron job runs every minute
- Finds expired reservations (```expiresAt < NOW()```)
- Releases stock back to available pool
- Updates status to 'expired'

---

## 2. Concurrency Handling
- Database transactions with FOR UPDATE locks
- Redis distributed locks prevent race conditions
- Optimistic locking with version columns
- Queue-based processing (Bull/Redis) for high traffic
- Stock validation before reservation

---

## 3. Architecture Diagram
![Alt text](database_schema.png)

---

## 4. Trade-offs & Limits

### Trade-offs:
- Strong consistency over performance (no overselling)
- Real-time updates over eventual consistency
- Database-centric over cache-based stock management

### Limitations:
- Scale: ~1000 req/sec per instance
- Bottleneck: Database write contention
- SPOF: Central database (mitigate with clustering)

