UPDATE decisions
SET
  state = 'withdraw',
  decision = CASE WHEN decision = 'withdrawn' THEN 'withdraw' ELSE decision END,
  updated_at = NOW()
WHERE state = 'withdrawn' OR decision = 'withdrawn';

UPDATE decision_state_transitions
SET from_state = 'withdraw'
WHERE from_state = 'withdrawn';

UPDATE decision_state_transitions
SET to_state = 'withdraw'
WHERE to_state = 'withdrawn';
