-- RPC function to get overall platform stats efficiently
CREATE OR REPLACE FUNCTION get_platform_overview()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_students int;
  v_total_exams int;
  v_total_question_exams int;
  v_total_attempts int;
  v_total_graded int;
  v_avg_score numeric;
  v_pass_rate numeric;
  v_total_materials int;
BEGIN
  SELECT count(*) INTO v_total_students FROM profiles WHERE role = 'student';
  SELECT count(*) INTO v_total_exams FROM exams;
  SELECT count(*) INTO v_total_question_exams FROM exams WHERE type = 'questions';
  SELECT count(*) INTO v_total_attempts FROM exam_attempts;
  SELECT count(*) INTO v_total_graded FROM scores;
  SELECT count(*) INTO v_total_materials FROM materials;
  
  IF v_total_graded > 0 THEN
    SELECT avg(percentage) INTO v_avg_score FROM scores;
    SELECT (count(*) * 100.0 / v_total_graded) INTO v_pass_rate FROM scores WHERE is_passed = true;
  ELSE
    v_avg_score := null;
    v_pass_rate := null;
  END IF;

  RETURN json_build_object(
    'total_students', v_total_students,
    'total_exams', v_total_exams,
    'total_question_exams', v_total_question_exams,
    'total_attempts', v_total_attempts,
    'total_graded', v_total_graded,
    'avg_platform_score', round(v_avg_score, 2),
    'overall_pass_rate', round(v_pass_rate, 2),
    'total_materials', v_total_materials
  );
END;
$$;

-- RPC function to get paginated top students efficiently
CREATE OR REPLACE FUNCTION get_top_students(p_limit int, p_offset int)
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  avg_score numeric,
  exams_taken bigint,
  pass_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.user_id,
    p.name,
    p.email,
    round(avg(s.percentage), 2) as avg_score,
    count(s.id) as exams_taken,
    sum(CASE WHEN s.is_passed THEN 1 ELSE 0 END) as pass_count
  FROM scores s
  JOIN profiles p ON s.user_id = p.id
  GROUP BY s.user_id, p.name, p.email
  ORDER BY avg_score DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- RPC function to get total top students count
CREATE OR REPLACE FUNCTION get_top_students_count()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT count(DISTINCT user_id) INTO v_count FROM scores;
  RETURN v_count;
END;
$$;
