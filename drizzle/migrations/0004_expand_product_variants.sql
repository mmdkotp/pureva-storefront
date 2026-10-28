ALTER TABLE public.product_variants ADD COLUMN fragrance text, ADD COLUMN fragrance_en text, ADD COLUMN sku text, ADD COLUMN images text[] NOT NULL DEFAULT '{}';
CREATE UNIQUE INDEX variant_sku_unique ON public.product_variants(sku) WHERE sku IS NOT NULL;
ALTER TABLE public.product_variants ADD CONSTRAINT variant_sku_format CHECK(sku IS NULL OR (length(sku) BETWEEN 1 AND 80 AND sku ~ '^[A-Za-z0-9_-]+$'));
ALTER TABLE public.order_items ADD COLUMN fragrance text, ADD COLUMN variant_sku text;
CREATE OR REPLACE FUNCTION public.snapshot_variant_details() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN SELECT v.fragrance,coalesce(v.sku,v.id::text) INTO NEW.fragrance,NEW.variant_sku FROM public.product_variants v WHERE v.id=NEW.variant_id; RETURN NEW; END $$;
CREATE TRIGGER snapshot_variant_details BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.snapshot_variant_details();