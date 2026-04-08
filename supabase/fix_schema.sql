-- Correction du schéma pour les abonnements et les transactions
-- Exécutez ce script dans l'éditeur SQL de votre tableau de bord Supabase

-- 1. Ajout des colonnes manquantes pour les abonnements (indispensables au calcul des cycles)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS leap_day_start boolean DEFAULT false;

-- 2. Mise à jour de la table transactions pour supporter la dénormalisation (nom de catégorie, icône, couleur)
-- Cela permet de garder trace de la catégorie même si elle est supprimée plus tard.
ALTER TABLE public.transactions 
RENAME COLUMN category_name TO category_name_old; -- Au cas où une ancienne colonne existerait mal nommée

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS category_name text,
ADD COLUMN IF NOT EXISTS icon text,
ADD COLUMN IF NOT EXISTS color text;

-- 3. Ajout d'une colonne de statut pour les catégories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- 4. Rafraîchissement du cache du schéma (pour que Supabase voit les nouvelles colonnes immédiatement)
NOTIFY pgrst, 'reload schema';
