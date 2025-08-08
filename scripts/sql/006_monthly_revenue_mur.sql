-- Materialize the monthly view if needed for performance
drop materialized view if exists monthly_revenue_mur_mat;
create materialized view monthly_revenue_mur_mat as
select to_char(date_trunc('month', date), 'YYYY-MM') as month,
       sum(fee_mur) as total_mur
from consultation_logs
group by 1
order by 1;

create unique index if not exists uq_monthly_revenue_mur_mat on monthly_revenue_mur_mat(month);
