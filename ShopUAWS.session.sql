        SELECT
          l.listing_id,
          l.user_id,
          l.title,
          l.description,
          c.name AS category,  -- Get the category name
          l.item_type,
          l.star_rating,
          l.price,
          ARRAY_AGG(li.file_key) AS file_keys 
        FROM
          listings l
        JOIN
          categories c ON l.category_id = c.category_id
        INNER JOIN
          listing_images li ON l.listing_id = li.listing_id
        GROUP BY
          l.listing_id, 
          l.title, 
          l.description, 
          c.name, 
          l.item_type, 
          l.star_rating, 
          l.price;