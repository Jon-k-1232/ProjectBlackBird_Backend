--
-- Name: jobdefinition; Type: SEED; -
--

INSERT INTO public.jobdefinition
    ("description","defaulttargetprice","hourstocomplete","billable")
VALUES
('AUDIT',12.50,0.00,TRUE),
('ACCOUNTING',100.0,0.00,TRUE),
('BS',0.00,0.00,FALSE),
('PERSONAL INCOME TAX RETURN PREPARATION',50.00,0.00,TRUE),
('GENERAL WORK',10.00,0.00,TRUE),
('PREPARATION OF ANNUAL REPORT & CERT. OF DISCLOSURE',200.00,0.00,TRUE);
