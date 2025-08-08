-- Optional view for monthly revenue (if you prefer querying directly)
create or replace view monthly_revenue_mur as
select to_char(date_trunc('month', date), 'YYYY-MM') as month,
       sum(fee_mur) as total_mur
from consultation_logs
group by 1
order by 1;
