-- STAGING ONLY: transaction-scoped Phase 0 behavior checks using existing
-- synthetic Auth users. Do not run against Production.
--
-- The disposable admin rows, cash boxes, student/course/expense records,
-- archive event and outbox row are created inside an exception subtransaction
-- that is deliberately rolled back. No notification dispatcher is invoked.
-- The final SELECT returns a session-local JSON result summary.

DO $phase0_test$
DECLARE
  v_results jsonb := '[]'::jsonb;
  v_state text;
  v_message text;
  v_is_admin boolean;
  v_box_id uuid;
  v_creator_box_id uuid;
  v_limit_box_id uuid;
  v_student_id uuid;
  v_course_id uuid;
  v_expense_id uuid;
  v_name text := 'phase0-test-' || gen_random_uuid()::text;
  v_added_by uuid;
  v_egp numeric;
  v_usd numeric;
  v_count integer;
  v_outbox_count integer;
  v_unsent_count integer;
BEGIN
  -- Admin activation checks use disposable identities created by the earlier
  -- Staging test setup. No credentials are used and no sign-in occurs.
  PERFORM set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_is_admin := public.is_admin();
  EXECUTE 'RESET ROLE';
  v_results := v_results || jsonb_build_array(jsonb_build_object(
    'case','is_admin_active_synthetic_owner','passed',v_is_admin IS TRUE,
    'detail','expected true; actual=' || COALESCE(v_is_admin::text,'NULL')));

  PERFORM set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_is_admin := public.is_admin();
  EXECUTE 'RESET ROLE';
  v_results := v_results || jsonb_build_array(jsonb_build_object(
    'case','is_admin_inactive_synthetic_user','passed',v_is_admin IS FALSE,
    'detail','expected false; actual=' || COALESCE(v_is_admin::text,'NULL')));

  PERFORM set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_is_admin := public.is_admin();
  EXECUTE 'RESET ROLE';
  v_results := v_results || jsonb_build_array(jsonb_build_object(
    'case','is_admin_synthetic_regular_user','passed',v_is_admin IS FALSE,
    'detail','expected false before temporary RBAC fixture; actual=' || COALESCE(v_is_admin::text,'NULL')));

  -- All persistent effects below are rolled back by the PZ001 exception.
  BEGIN
    INSERT INTO public.admins (auth_user_id, role, is_active, is_owner)
    VALUES
      ('a0000000-0000-0000-0000-000000000003','academy_manager',true,false),
      ('a0000000-0000-0000-0000-000000000004','finance_manager',true,false);

    PERFORM set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    v_is_admin := public.is_admin();
    EXECUTE 'RESET ROLE';
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'case','temporary_academy_manager_is_admin','passed',v_is_admin IS TRUE,
      'detail','expected true; actual=' || COALESCE(v_is_admin::text,'NULL')));

    PERFORM set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    v_is_admin := public.is_admin();
    EXECUTE 'RESET ROLE';
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'case','temporary_finance_manager_is_admin','passed',v_is_admin IS TRUE,
      'detail','expected true; actual=' || COALESCE(v_is_admin::text,'NULL')));

    -- The synthetic owner is used only for the owner-gated cash-box create
    -- and archive operations. This account is never used for interactive login.
    PERFORM set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    v_box_id := public.rbac_create_cash_box_v2(v_name,'Main',NULL,120.00,35.50,'Phase 0 rollback-only test');
    EXECUTE 'RESET ROLE';
    SELECT added_by,opening_balance,opening_balance_usd
      INTO v_added_by,v_egp,v_usd FROM public.cash_boxes WHERE cash_box_id=v_box_id;
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'case','cash_box_create_egp_usd','passed',v_box_id IS NOT NULL
        AND v_added_by='a0000000-0000-0000-0000-000000000001'::uuid
        AND v_egp=120.00 AND v_usd=35.50,
      'detail',jsonb_build_object('box_id',v_box_id,'added_by',v_added_by,'egp',v_egp,'usd',v_usd)));

    -- Negative input checks must reject before a row is inserted.
    BEGIN
      PERFORM public.rbac_create_cash_box_v2(v_name||'-negative-egp','Main',NULL,-0.01,0,NULL);
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_negative_egp','passed',false,'detail','RPC unexpectedly accepted negative EGP'));
    EXCEPTION WHEN SQLSTATE '22023' THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_negative_egp','passed',true,'detail','rejected with SQLSTATE 22023'));
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_negative_egp','passed',false,'detail',v_state||': '||v_message));
    END;

    BEGIN
      PERFORM public.rbac_create_cash_box_v2(v_name||'-negative-usd','Main',NULL,0,-0.01,NULL);
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_negative_usd','passed',false,'detail','RPC unexpectedly accepted negative USD'));
    EXCEPTION WHEN SQLSTATE '22023' THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_negative_usd','passed',true,'detail','rejected with SQLSTATE 22023'));
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_negative_usd','passed',false,'detail',v_state||': '||v_message));
    END;

    -- Boundary value is inclusive; these accepted rows are rolled back by
    -- their local PZ002 subtransactions immediately after verification.
    BEGIN
      v_limit_box_id := public.rbac_create_cash_box_v2(v_name||'-max-egp','Main',NULL,99999999.99,0,NULL);
      SELECT opening_balance INTO v_egp FROM public.cash_boxes WHERE cash_box_id=v_limit_box_id;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_egp_max_inclusive','passed',v_egp=99999999.99,'detail','expected 99999999.99; actual='||COALESCE(v_egp::text,'NULL')));
      RAISE EXCEPTION USING ERRCODE='PZ002',MESSAGE='rollback accepted EGP boundary fixture';
    EXCEPTION WHEN SQLSTATE 'PZ002' THEN NULL;
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_egp_max_inclusive','passed',false,'detail',v_state||': '||v_message));
    END;

    BEGIN
      v_limit_box_id := public.rbac_create_cash_box_v2(v_name||'-max-usd','Main',NULL,0,99999999.99,NULL);
      SELECT opening_balance_usd INTO v_usd FROM public.cash_boxes WHERE cash_box_id=v_limit_box_id;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_usd_max_inclusive','passed',v_usd=99999999.99,'detail','expected 99999999.99; actual='||COALESCE(v_usd::text,'NULL')));
      RAISE EXCEPTION USING ERRCODE='PZ002',MESSAGE='rollback accepted USD boundary fixture';
    EXCEPTION WHEN SQLSTATE 'PZ002' THEN NULL;
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_usd_max_inclusive','passed',false,'detail',v_state||': '||v_message));
    END;

    BEGIN
      PERFORM public.rbac_create_cash_box_v2(v_name||'-over-egp','Main',NULL,100000000.00,0,NULL);
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_egp_over_max','passed',false,'detail','RPC unexpectedly accepted over-limit EGP'));
    EXCEPTION WHEN SQLSTATE '22023' THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_egp_over_max','passed',true,'detail','rejected with SQLSTATE 22023'));
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_egp_over_max','passed',false,'detail',v_state||': '||v_message));
    END;

    BEGIN
      PERFORM public.rbac_create_cash_box_v2(v_name||'-over-usd','Main',NULL,0,100000000.00,NULL);
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_usd_over_max','passed',false,'detail','RPC unexpectedly accepted over-limit USD'));
    EXCEPTION WHEN SQLSTATE '22023' THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_usd_over_max','passed',true,'detail','rejected with SQLSTATE 22023'));
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_usd_over_max','passed',false,'detail',v_state||': '||v_message));
    END;

    -- Caller-boundary behavior tests. Every expected-error call executes as
    -- database role authenticated with a synthetic request subject.
    BEGIN
      PERFORM set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000004',true);
      PERFORM set_config('request.jwt.claim.role','authenticated',true);
      EXECUTE 'SET LOCAL ROLE authenticated';
      PERFORM public.rbac_create_student('phase0-denied-student',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
      EXECUTE 'RESET ROLE';
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','finance_manager_denied_student_create','passed',false,'detail','RPC unexpectedly allowed'));
    EXCEPTION WHEN SQLSTATE '42501' THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','finance_manager_denied_student_create','passed',true,'detail','rejected with SQLSTATE 42501'));
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','finance_manager_denied_student_create','passed',false,'detail',v_state||': '||v_message));
    END;

    BEGIN
      PERFORM set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000004',true);
      PERFORM set_config('request.jwt.claim.role','authenticated',true);
      EXECUTE 'SET LOCAL ROLE authenticated';
      v_course_id := public.rbac_create_course_v2(v_name||'-denied-course');
      EXECUTE 'RESET ROLE';
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','finance_manager_denied_course_create','passed',false,'detail','RPC unexpectedly allowed'));
    EXCEPTION WHEN SQLSTATE '42501' THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','finance_manager_denied_course_create','passed',true,'detail','rejected with SQLSTATE 42501'));
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','finance_manager_denied_course_create','passed',false,'detail',v_state||': '||v_message));
    END;

    BEGIN
      PERFORM set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000003',true);
      PERFORM set_config('request.jwt.claim.role','authenticated',true);
      EXECUTE 'SET LOCAL ROLE authenticated';
      v_expense_id := public.rbac_record_expense(v_box_id,1.00,CURRENT_DATE,'Other','phase0 denied expense','rollback-only',NULL);
      EXECUTE 'RESET ROLE';
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','academy_manager_denied_expense_record','passed',false,'detail','RPC unexpectedly allowed'));
    EXCEPTION WHEN SQLSTATE '42501' THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','academy_manager_denied_expense_record','passed',true,'detail','rejected with SQLSTATE 42501'));
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','academy_manager_denied_expense_record','passed',false,'detail',v_state||': '||v_message));
    END;

    BEGIN
      PERFORM set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000003',true);
      PERFORM set_config('request.jwt.claim.role','authenticated',true);
      EXECUTE 'SET LOCAL ROLE authenticated';
      v_student_id := public.rbac_create_student('phase0-allowed-student',NULL,NULL,NULL,NULL,NULL,'rollback-only',NULL);
      EXECUTE 'RESET ROLE';
      SELECT count(*) INTO v_count FROM public.students WHERE student_id=v_student_id;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','academy_manager_allowed_student_create','passed',v_count=1,'detail','row observed inside rollback subtransaction; id='||v_student_id::text));
      RAISE EXCEPTION USING ERRCODE='PZ002',MESSAGE='rollback allowed student fixture';
    EXCEPTION WHEN SQLSTATE 'PZ002' THEN NULL;
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','academy_manager_allowed_student_create','passed',false,'detail',v_state||': '||v_message));
    END;

    BEGIN
      PERFORM set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000003',true);
      PERFORM set_config('request.jwt.claim.role','authenticated',true);
      EXECUTE 'SET LOCAL ROLE authenticated';
      v_course_id := public.rbac_create_course_v2(v_name||'-allowed-course');
      EXECUTE 'RESET ROLE';
      SELECT count(*) INTO v_count FROM public.courses WHERE course_id=v_course_id;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','academy_manager_allowed_course_create','passed',v_count=1,'detail','row observed inside rollback subtransaction; id='||v_course_id::text));
      RAISE EXCEPTION USING ERRCODE='PZ002',MESSAGE='rollback allowed course fixture';
    EXCEPTION WHEN SQLSTATE 'PZ002' THEN NULL;
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','academy_manager_allowed_course_create','passed',false,'detail',v_state||': '||v_message));
    END;

    BEGIN
      PERFORM set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000004',true);
      PERFORM set_config('request.jwt.claim.role','authenticated',true);
      EXECUTE 'SET LOCAL ROLE authenticated';
      v_expense_id := public.rbac_record_expense(v_box_id,1.00,CURRENT_DATE,'Other','phase0 allowed expense','rollback-only',NULL);
      EXECUTE 'RESET ROLE';
      SELECT count(*) INTO v_count FROM public.expenses WHERE expense_id=v_expense_id;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','finance_manager_allowed_expense_record','passed',v_count=1,'detail','row observed inside rollback subtransaction; id='||v_expense_id::text));
      RAISE EXCEPTION USING ERRCODE='PZ002',MESSAGE='rollback allowed expense fixture';
    EXCEPTION WHEN SQLSTATE 'PZ002' THEN NULL;
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','finance_manager_allowed_expense_record','passed',false,'detail',v_state||': '||v_message));
    END;

    -- Trigger-level checks run as the database owner because API roles have no
    -- direct table UPDATE/DELETE grants. They do not imply an app update API.
    PERFORM set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000004',true);
    BEGIN
      UPDATE public.cash_boxes SET opening_balance=opening_balance+1 WHERE cash_box_id=v_box_id;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_egp_opening_immutable_trigger','passed',false,'detail','UPDATE unexpectedly allowed'));
    EXCEPTION WHEN SQLSTATE 'P0001' THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_egp_opening_immutable_trigger','passed',true,'detail','trigger rejected mutation'));
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_egp_opening_immutable_trigger','passed',false,'detail',v_state||': '||v_message));
    END;

    BEGIN
      UPDATE public.cash_boxes SET opening_balance_usd=opening_balance_usd+1 WHERE cash_box_id=v_box_id;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_usd_opening_immutable_trigger','passed',false,'detail','UPDATE unexpectedly allowed'));
    EXCEPTION WHEN SQLSTATE 'P0001' THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_usd_opening_immutable_trigger','passed',true,'detail','trigger rejected mutation'));
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_usd_opening_immutable_trigger','passed',false,'detail',v_state||': '||v_message));
    END;

    BEGIN
      UPDATE public.cash_boxes SET added_by='a0000000-0000-0000-0000-000000000003'::uuid WHERE cash_box_id=v_box_id;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_creator_reassignment_blocked','passed',false,'detail','UPDATE unexpectedly allowed'));
    EXCEPTION WHEN SQLSTATE 'P0001' THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_creator_reassignment_blocked','passed',true,'detail','trigger rejected arbitrary creator reassignment'));
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_creator_reassignment_blocked','passed',false,'detail',v_state||': '||v_message));
    END;

    -- A metadata update is tested at trigger level only. No client metadata
    -- update RPC exists in the current routine inventory.
    UPDATE public.cash_boxes SET name=v_name||'-renamed',notes='metadata trigger check' WHERE cash_box_id=v_box_id;
    SELECT count(*) INTO v_outbox_count
      FROM public.platform_audit_events e JOIN public.telegram_notification_outbox o USING(event_id)
      WHERE e.subject_type='cash_box' AND e.subject_id=v_box_id AND e.event_type='finance.cash_box_archived';
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'case','cash_box_metadata_trigger_allowed_no_archive_event','passed',v_outbox_count=0,
      'detail','archive events before archive='||v_outbox_count::text));

    -- Even with postgres as the SQL session role, an authenticated direct
    -- DELETE is blocked by the BEFORE DELETE trigger; API ACLs separately deny it.
    BEGIN
      DELETE FROM public.cash_boxes WHERE cash_box_id=v_box_id;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_hard_delete_blocked','passed',false,'detail','DELETE unexpectedly allowed'));
    EXCEPTION WHEN SQLSTATE '42501' THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_hard_delete_blocked','passed',true,'detail','trigger rejected direct DELETE'));
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
      v_results := v_results || jsonb_build_array(jsonb_build_object('case','cash_box_hard_delete_blocked','passed',false,'detail',v_state||': '||v_message));
    END;

    PERFORM set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000001',true);
    PERFORM set_config('request.jwt.claim.role','authenticated',true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    v_is_admin := public.rbac_archive_cash_box(v_box_id);
    EXECUTE 'RESET ROLE';
    SELECT count(*),count(*) FILTER (WHERE o.sent_at IS NULL)
      INTO v_outbox_count,v_unsent_count
      FROM public.platform_audit_events e JOIN public.telegram_notification_outbox o USING(event_id)
      WHERE e.subject_type='cash_box' AND e.subject_id=v_box_id AND e.event_type='finance.cash_box_archived';
    SELECT is_active INTO v_is_admin FROM public.cash_boxes WHERE cash_box_id=v_box_id;
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'case','cash_box_archive_rpc_queues_exactly_one_unsent_event',
      'passed',v_outbox_count=1 AND v_unsent_count=1 AND v_is_admin IS FALSE,
      'detail',jsonb_build_object('archive_events',v_outbox_count,'unsent_outbox_rows',v_unsent_count,'is_active',v_is_admin)));

    -- Test FK-driven creator nullification with an existing synthetic Auth
    -- identity. The Auth row and all cascades are inside the outer rollback.
    PERFORM set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000004',true);
    v_creator_box_id := NULL;
    INSERT INTO public.cash_boxes (name,type,opening_balance,opening_balance_usd,notes)
      VALUES (v_name||'-creator-delete','Main',70.00,15.00,'creator delete rollback test')
      RETURNING cash_box_id INTO v_creator_box_id;
    SELECT added_by,opening_balance,opening_balance_usd INTO v_added_by,v_egp,v_usd
      FROM public.cash_boxes WHERE cash_box_id=v_creator_box_id;
    DELETE FROM auth.users WHERE id='a0000000-0000-0000-0000-000000000004'::uuid;
    SELECT added_by,opening_balance,opening_balance_usd INTO v_added_by,v_egp,v_usd
      FROM public.cash_boxes WHERE cash_box_id=v_creator_box_id;
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'case','auth_user_delete_nulls_cash_box_creator_preserves_balances',
      'passed',v_added_by IS NULL AND v_egp=70.00 AND v_usd=15.00,
      'detail',jsonb_build_object('added_by_after_delete',v_added_by,'egp',v_egp,'usd',v_usd)));

    RAISE EXCEPTION USING ERRCODE='PZ001',MESSAGE='rollback all Phase 0 behavior fixtures';
  EXCEPTION WHEN SQLSTATE 'PZ001' THEN
    v_results := v_results || jsonb_build_array(jsonb_build_object('case','fixture_rollback','passed',true,'detail','all temporary rows and outbox effects rolled back'));
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE,v_message=MESSAGE_TEXT;
    v_results := v_results || jsonb_build_array(jsonb_build_object('case','fixture_rollback','passed',false,'detail',v_state||': '||v_message));
  END;

  PERFORM set_config('phase0.behavior_test_results',v_results::text,false);
END;
$phase0_test$;

SELECT current_setting('phase0.behavior_test_results',true)::jsonb AS test_results;
