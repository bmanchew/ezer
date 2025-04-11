# Database Query Optimization Suggestions

## Indexes
- Add indexes to frequently queried columns:
  ```sql
  CREATE INDEX idx_user_email ON users(email);
  CREATE INDEX idx_team_owner_id ON teams(owner_id);
  CREATE INDEX idx_team_member_team_id ON team_members(team_id);
  CREATE INDEX idx_team_member_user_id ON team_members(user_id);
  ```

## Query Optimization
- Use specific column selection instead of SELECT *
- Add LIMIT to pagination queries
- Use JOIN instead of nested queries where possible
- Consider using query caching for frequently accessed data

## Connection Pooling
- Implement connection pooling to reduce database connection overhead
- Configure appropriate pool size based on expected load

## Batch Operations
- Use bulk inserts/updates when processing multiple records
- Consider using transactions for related operations
