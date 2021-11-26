--
-- Name: employee; Type: SEED; -
--

INSERT INTO public.employee
    ("firstname","lastname","middlei","ssn","employeenumber","address1","address2","city","state","zip","homephone","mobilephone","workphone","pager","fax","otherphone","contact","startdate","availabledate","hourlycost","inactive","note","passwrd","usertype","username")
VALUES
('EMPLOYEE_ONE_FN','EMPLOYEE_ONE_LN',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'1/1/2001 0:00:00',NULL,128.00,FALSE,NULL,NULL,NULL,NULL),
('EMPLOYEE_TWO_FN','EMPLOYEE_TWO_LN',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'1/1/2001 0:00:00',NULL,83.50,FALSE,NULL,NULL,NULL,NULL),
('EMPLOYEE_THREE_FN','EMPLOYEE_THREE_LN',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'1/1/2001 0:00:00',NULL,20.00,FALSE,NULL,NULL,NULL,NULL);
