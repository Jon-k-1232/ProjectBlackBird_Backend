--
-- Name: setupdata; Type: SEED; -
--

INSERT INTO public.setupdata
    ("customername","customeraddress","customercity","customerstate","customerzip","customerphone","customerfax","dayofweek","calendarweekrule","lastinvoicenumber","lockedby","statementtext")
VALUES
('JONS SHOP','1641 NORTH TATUM BLVD','PHOENIX','AZ',85032,'602-788-0903','602-867-8843',0,0,205755,NULL,'Balances unpaid for 30 days accrue interest at the rate of 18% per annum.');
