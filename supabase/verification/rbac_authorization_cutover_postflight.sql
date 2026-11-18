WITH protected(name) AS (VALUES
  ('admins'), ('students'), ('courses'), ('enrollments'), ('payments'), ('expenses'),
  ('cash_boxes'), ('cash_box_transfers'), ('enrollment_balances'), ('cash_box_balances'),
  ('course_financial_summary'), ('dashboard_metrics')
),
violations AS (
  SELECT c.relname
  FROM protected p
  JOIN pg_class c ON c.relname=p.name
  JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public'
  WHERE has_table_privilege('anon',c.oid,'SELECT')
     OR has_table_privilege('anon',c.oid,'INSERT')
     OR has_table_privilege('anon',c.oid,'UPDATE')
     OR has_table_privilege('anon',c.oid,'DELETE')
     OR has_table_privilege('anon',c.oid,'TRUNCATE')
     OR has_table_privilege('anon',c.oid,'REFERENCES')
     OR has_table_privilege('anon',c.oid,'TRIGGER')
     OR has_table_privilege('anon',c.oid,'MAINTAIN')
     OR has_table_privilege('authenticated',c.oid,'SELECT')
     OR has_table_privilege('authenticated',c.oid,'INSERT')
     OR has_table_privilege('authenticated',c.oid,'UPDATE')
     OR has_table_privilege('authenticated',c.oid,'DELETE')
     OR has_table_privilege('authenticated',c.oid,'TRUNCATE')
     OR has_table_privilege('authenticated',c.oid,'REFERENCES')
     OR has_table_privilege('authenticated',c.oid,'TRIGGER')
     OR has_table_privilege('authenticated',c.oid,'MAINTAIN')
),
legacy_exec AS (
  SELECT p.oid::regprocedure AS signature
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname = ANY (ARRAY[
      'enroll_student','record_payment','record_expense','transfer_between_boxes',
      'void_payment','void_expense','set_enrollment_status','create_cash_box'
    ])
    AND (has_function_privilege('anon',p.oid,'EXECUTE')
      OR has_function_privilege('authenticated',p.oid,'EXECUTE'))
),
rbac_bad AS (
  SELECT p.oid::regprocedure AS signature
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  JOIN pg_roles r ON r.oid=p.proowner
  WHERE n.nspname='public' AND p.proname LIKE 'rbac\_%' ESCAPE '\'
    AND (p.prosecdef IS NOT TRUE
      OR (r.rolsuper IS NOT TRUE AND r.rolbypassrls IS NOT TRUE)
      OR NOT has_function_privilege('authenticated',p.oid,'EXECUTE')
      OR has_function_privilege('anon',p.oid,'EXECUTE'))
),
checks AS (
  SELECT 'client table and view grants removed' AS check_name,
         NOT EXISTS (SELECT 1 FROM violations) AS passed,
         COALESCE((SELECT jsonb_agg(relname) FROM violations),'[]'::jsonb)::text AS details
  UNION ALL
  SELECT 'legacy RPC execution revoked', NOT EXISTS (SELECT 1 FROM legacy_exec),
         COALESCE((SELECT jsonb_agg(signature::text) FROM legacy_exec),'[]'::jsonb)::text
  UNION ALL
  SELECT 'RBAC RPCs are owner-checked SECURITY DEFINER endpoints',
         NOT EXISTS (SELECT 1 FROM rbac_bad),
         COALESCE((SELECT jsonb_agg(signature::text) FROM rbac_bad),'[]'::jsonb)::text
  UNION ALL
  SELECT 'receipt sequence access revoked',
         NOT has_sequence_privilege('anon','public.payment_receipt_number_seq','USAGE')
         AND NOT has_sequence_privilege('authenticated','public.payment_receipt_number_seq','USAGE')
         AND NOT has_sequence_privilege('authenticated','public.payment_receipt_number_seq','SELECT')
         AND NOT has_sequence_privilege('authenticated','public.payment_receipt_number_seq','UPDATE'),
         'Checks anon/authenticated sequence privileges'
  UNION ALL
  SELECT 'service_role retains required protected-table access',
         NOT EXISTS (
           SELECT 1 FROM (VALUES ('admins'),('students'),('courses'),('enrollments'),('payments'),('expenses'),('cash_boxes'),('cash_box_transfers')) t(name)
           JOIN pg_class c ON c.relname=t.name JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public'
           WHERE NOT has_table_privilege('service_role',c.oid,'SELECT')
              OR NOT has_table_privilege('service_role',c.oid,'INSERT')
         ),
         'Checks service_role SELECT/INSERT on protected base tables'
)
SELECT check_name, passed, details FROM checks ORDER BY check_name;
