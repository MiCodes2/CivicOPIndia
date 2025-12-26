-- Rename "Tree Plantation" -> "Plantation" and remove Rally/Workshops types (case-insensitive)

BEGIN;

-- Ensure canonical "Plantation" exists
INSERT INTO public.activity_types (name) VALUES ('Plantation') ON CONFLICT (name) DO NOTHING;

-- Map legacy tree variants and plain 'plantation' to Plantation (case-insensitive)
UPDATE public.activities
SET type = 'Plantation'
WHERE LOWER(COALESCE(type, '')) IN ('tree plantation','treeplantation','tree-plantation','plantation');

-- Reassign Rally and Workshops (and common variants) to 'Other' to avoid leaving orphan types
UPDATE public.activities
SET type = 'Other'
WHERE LOWER(COALESCE(type, '')) IN ('rally','rallies','workshop','workshops');

-- Remove Rally and Workshops and legacy 'Tree Plantation' from the lookup table (case-insensitive)
DELETE FROM public.activity_types WHERE LOWER(COALESCE(name, '')) IN ('rally','rallies','workshop','workshops','tree plantation','treeplantation','tree-plantation');

COMMIT;