INSERT INTO categories (category_id, parent_category_id, name) 
VALUES (DEFAULT, 2, 'Sample Category');

INSERT INTO public.categories (category_id, parent_category_id, name) 
VALUES (DEFAULT, 2, 'Sample Category 1'),
       (DEFAULT, 3, 'Sample Category 2'),
       (DEFAULT, 4, 'Sample Category 3');