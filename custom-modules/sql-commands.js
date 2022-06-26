// SQL commands

const sql_commands = {
    create_users_table: `create table if not exists users (
        userid int(8) unsigned auto_increment,
        password varchar(10) not null,
        type varchar(10) not null,
        active boolean not null,
        primary key (userid)
    );`,
    drop_users_table:
        `drop table if exists users;`,
    delete_users_with_id: (userid) => {
        return `delete from users where userid = ${userid};`;
    },
    get_all_users:
        `select * from users where type != "admin" order by userid;`,
    get_users_with_id: (userid) => {
        return `select * from users where userid = ${userid};`;
    },
    get_users_with_id_password: (userid, password) => {
        return `select * from users where userid = ${userid} and password = "${password}";`;
    },
    insert_users_table: (password, type, active) => {
        return `insert into users ( password, type, active ) 
        values ( "${password}", "${type}", ${active} );`;
    },
    update_users_with_id: (userid, password, type, active) => {
        if (password) { return `update users set password = "${password}" where userid = ${userid};`; }
        else if (type) { return `update users set type = "${type}" where userid = ${userid};`; }
        else if (active) { return `update users set active = ${active} where userid = ${userid};`; }
    },
    create_students_table: `create table if not exists students (
        userid int(8) unsigned not null,
        name varchar(50) not null,
        course varchar(10) not null,
        dob date not null,
        email varchar(50) not null,
        phone varchar(10) not null,
        address varchar(100),
        foreign key (userid) references users (userid) on delete cascade,
        primary key (userid)
    );`,
    drop_students_table:
        `drop table if exists students;`,
    delete_students_with_id: (userid) => {
        return `delete from students where userid = ${userid};`;
    },
    get_all_students:
        `select * from students order by userid;`,
    get_all_students_with_course: (course) => {
        return `select * from students where course = "${course}" order by userid;`;
    },
    get_students_with_id: (userid) => {
        return `select * from students where userid = ${userid};`;
    },
    insert_students_table: (userid, name, course, dob, email, phone, address) => {
        return `insert into students ( userid, name, course, dob, email, phone, address ) 
        values ( ${userid}, "${name}", "${course}", "${dob}", "${email}", "${phone}", "${address}" );`;
    },
    update_students_with_id: (userid, name, course, dob, email, phone, address) => {
        if (name) { return `update students set name = "${name}" where userid = ${userid};`; }
        else if (course) { return `update students set course = "${course}" where userid = ${userid};`; }
        else if (dob) { return `update students set dob = "${dob}" where userid = ${userid};`; }
        else if (email) { return `update students set email = "${email}" where userid = ${userid};`; }
        else if (phone) { return `update students set phone = "${phone}" where userid = ${userid};`; }
        else if (address) { return `update students set address = "${address}" where userid = ${userid};`; }
    },
    create_teachers_table: `create table if not exists teachers (
        userid int(8) unsigned not null,
        name varchar(50) not null,
        course varchar(10) not null,
        dob date not null,
        email varchar(50) not null,
        phone varchar(10) not null,
        address varchar(100),
        foreign key (userid) references users (userid) on delete cascade,
        primary key (userid)
    );`,
    drop_teachers_table:
        `drop table if exists teachers;`,
    delete_teachers_with_id: (userid) => {
        return `delete from teachers where userid = ${userid};`;
    },
    get_all_teachers:
        `select * from teachers order by userid;`,
    get_teachers_with_id: (userid) => {
        return `select * from teachers where userid = ${userid};`;
    },
    insert_teachers_table: (userid, name, course, dob, email, phone, address) => {
        return `insert into teachers ( userid, name, course, dob, email, phone, address ) 
        values ( ${userid}, "${name}", "${course}", "${dob}", "${email}", "${phone}", "${address}" );`;
    },
    update_teachers_with_id: (userid, name, course, dob, email, phone, address) => {
        if (name) { return `update teachers set name = "${name}" where userid = ${userid};`; }
        else if (course) { return `update teachers set course = "${course}" where userid = ${userid};`; }
        else if (dob) { return `update teachers set dob = "${dob}" where userid = ${userid};`; }
        else if (email) { return `update teachers set email = "${email}" where userid = ${userid};`; }
        else if (phone) { return `update teachers set phone = "${phone}" where userid = ${userid};`; }
        else if (address) { return `update teachers set address = "${address}" where userid = ${userid};`; }
    },
    create_question_papers_table: `create table if not exists question_papers (
        filename varchar(50) not null,
        course varchar(10) not null,
        marks int(4) unsigned not null,
        active boolean not null,
        modified_date date not null,
        primary key (filename)
    );`,
    drop_question_papers_table:
        `drop table if exists question_papers;`,
    delete_question_papers_with_name: (filename) => {
        return `delete from question_papers where filename = "${filename}";`;
    },
    get_all_question_papers:
        `select * from question_papers order by  course order by modifed_date desc, course;`,
    get_all_question_papers_with_course: (course) => {
        return `select * from question_papers where course = "${course}" order by modified_date desc;`
    },
    get_question_papers_with_course_active: (course) => {
        return `select * from question_papers where course = "${course}" and active = true;`
    },
    get_question_paper_with_id: (userid) => {
        return `select * from asnainmiamxe_snheeiel where userid = ${userid} order by modified_date desc;`;
    },
    get_question_papers_with_name: (filename) => {
        return `select * from question_papers where filename = "${filename}";`
    },
    insert_question_papers_table: (filename, course, marks) => {
        return `insert into question_papers ( filename, course, marks, active, modified_date ) 
        values ( "${filename}", "${course}", ${marks}, false, current_date );`
    },
    update_question_papers_table: (filename, active) => {
        return `update question_papers set active = ${active}, modified_date = current_date where filename = "${filename}";`
    },
    update_all_question_papers_table_except: (filename, course) => {
        return `update question_papers set active = false where course = "${course}" and filename != "${filename}";`
    },
    create_answer_papers_table: `create table if not exists answer_papers (
        question_filename varchar(50) not null,
        userid int(8) unsigned not null,
        marks int(4) unsigned,
        submit_date date not null,
        foreign key (question_filename) references question_papers (filename) on delete cascade,
        foreign key (userid) references users (userid) on delete cascade,
        primary key ( question_filename, userid )
    );`,
    drop_answer_papers_table:
        `drop table if exists answer_papers;`,
    delete_all_answer_papers_with_id: (userid) => {
        return `delete from answer_papers where userid = ${userid};`;
    },
    delete_all_answer_papers_with_Qname: (question_filename) => {
        return `delete from answer_papers where question_filename = "${question_filename}";`;
    },
    get_all_answer_papers:
        `select * from answer_papers order by submit_date desc, userid;`,
    get_all_answer_papers_with_Qname: (question_filename) => {
        return `select * from answer_papers where question_filename = "${question_filename}" order by submit_date desc, userid;`
    },
    get_all_answer_paper_with_course: (course) => {
        return `select * from asnainmiamxe_snheeiel where course = "${course}" order by userid;`;
    },
    get_all_answer_papers_with_id: (userid) => {
        return `select * from answer_papers where userid = "${userid} order by submit_date desc";`
    },
    get_answer_papers_with_Qname_id: (question_filename, userid) => {
        return `select * from answer_papers where question_filename = "${question_filename}" and userid = "${userid}";`
    },
    insert_answer_papers_table: (question_filename, userid) => {
        return `insert into answer_papers ( question_filename, userid, submit_date ) 
        values ( "${question_filename}", "${userid}", current_date );`
    },
    update_answer_papers_table: (question_filename, userid, marks) => {
        return `update answer_papers set marks = ${marks} where question_filename = "${question_filename}" and userid = "${userid}";`
    },
    get_all_results_with_id: (userid) => {
        return `select question_filename, answer_papers.marks as marks_obtained, submit_date, course, question_papers.marks as full_marks from answer_papers, question_papers where answer_papers.userid = ${userid} and answer_papers.marks is not null and question_filename = filename order by submit_date desc;`
    },
};

module.exports = sql_commands;

