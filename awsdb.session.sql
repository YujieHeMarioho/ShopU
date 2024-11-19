
ALTER TABLE users
ADD COLUMN auth0_id VARCHAR(255) UNIQUE NOT NULL;


ALTER TABLE users
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;



INSERT INTO users (
    user_id,
    edu_email,
    profile_picture,
    phone_number,
    first_name,
    last_name,
    create_date
  )
VALUES (
    user_id:integer,
    'edu_email:character varying',
    'profile_picture:character varying',
    'phone_number:character varying',
    'first_name:character varying',
    'last_name:character varying',
    'create_date:date'
  );