-- 008_seed_pilot_subscribers.sql
-- Seed Astute Insights and BlackFire Solutions as Command-tier pilot subscribers
-- Passwords are placeholder bcrypt hashes — REPLACE before use

INSERT INTO subscribers (
    email, password_hash, company_name,
    bbbee_level, geographic_reach, service_lines, sectors,
    plan_tier, plan_active, onboarding_complete
)
VALUES
(
    'admin@astuteinsights.co.za',
    '$2b$12$PLACEHOLDER_HASH_REPLACE_ME_ASTUTE',
    'Astute Insights',
    1,
    ARRAY['national'],
    ARRAY[
        'data engineering', 'etl pipelines', 'data warehousing',
        'business intelligence', 'bi dashboards', 'analytics platforms',
        'executive reporting', 'performance monitoring', 'sla reporting',
        'systems integration', 'api development', 'digital transformation',
        'data governance', 'gis spatial analytics', 'ohs management',
        'safety file compilation'
    ],
    ARRAY['central government', 'soes', 'municipalities', 'health', 'education', 'industrial'],
    'command',
    TRUE,
    TRUE
),
(
    'admin@blackfiresolutions.co.za',
    '$2b$12$PLACEHOLDER_HASH_REPLACE_ME_BLACKFIRE',
    'BlackFire Solutions',
    1,
    ARRAY['national', 'provincial:GP'],
    ARRAY[
        'physical guarding', 'armed response', 'tactical response',
        'cctv installation', 'cctv management', 'access control systems',
        'perimeter security', 'electric fencing', 'drone surveillance',
        'aerial monitoring', 'facility security management',
        'security risk assessment', 'ohs compliance management',
        'security technology integration'
    ],
    ARRAY['government buildings', 'industrial', 'correctional services', 'public infrastructure', 'health'],
    'command',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;
