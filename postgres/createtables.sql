-- Table: public.users

-- DROP TABLE IF EXISTS public.users;
-- Table: public.users

CREATE TABLE IF NOT EXISTS public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    fullname character varying(255) COLLATE pg_catalog."default",
    password character varying(100) COLLATE pg_catalog."default" NOT NULL,
    active boolean DEFAULT true,
    photo bytea,
    birthdate date,
    gender character varying COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_name_unique UNIQUE (name)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;

-- DROP TABLE IF EXISTS public.sessions;
CREATE TABLE IF NOT EXISTS public.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    last_activity TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT sessions_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);


-- TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.sessions
    OWNER to reactuser;

-- Table: public.roles

-- DROP TABLE IF EXISTS public.roles;
CREATE TABLE IF NOT EXISTS public.roles
(
    id integer NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
    name character varying(150) COLLATE pg_catalog."default" NOT NULL,
    description character varying(200) COLLATE pg_catalog."default",
    CONSTRAINT roles_pkey PRIMARY KEY (id),
    CONSTRAINT roles_name_unique UNIQUE (name)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.roles
    OWNER to postgres;
-- USERS ROLES
-- Table: public.usersroles

CREATE TABLE IF NOT EXISTS public.usersroles
(
    id      SERIAL PRIMARY KEY,
    userid  INTEGER NOT NULL,
    roleid  INTEGER NOT NULL,

    CONSTRAINT usersroles_userid_fk 
        FOREIGN KEY (userid) 
        REFERENCES public.users(id)
        ON DELETE RESTRICT 
        ON UPDATE RESTRICT,

    CONSTRAINT usersroles_roleid_fk 
        FOREIGN KEY (roleid) 
        REFERENCES public.roles(id)
        ON DELETE RESTRICT 
        ON UPDATE RESTRICT
);

ALTER TABLE IF EXISTS public.usersroles
    OWNER TO reactuser;
