// SQL commands

const sql_commands = {
    create_users_table:
        `create table if not exists users (
        userid int(8) unsigned auto_increment,
        password varchar(10) not null,
        type varchar(10) not null,
        active boolean not null,
        primary key (userid));`,
    drop_users_table:
        `drop table if exists users;`,
    delete_users_with_id: //(userid)
        `delete from users where type != "admin" and userid = ?;`,
    select_all_users:
        `select * from users where type != "admin" order by userid;`,
    select_users_with_id: //(userid)
        `select * from users where type != "admin" and userid = ?;`,
    select_users_with_id_password: //(userid,password)
        `select * from users where userid = ? and password = ?;`,
    insert_users_table: //(password,type,active)
        `insert into users ( password, type, active ) values ( ?, ?, ? );`,
    update_users_with_id: (feild_name) => { //(feild_value,userid)
        if (["password", "type", "active"].includes(feild_name))
            return `update users set ${feild_name} = ? where userid = ?;`;
    },
    create_students_table:
        `create table if not exists students (
        userid int(8) unsigned not null,
        name varchar(50) not null,
        course varchar(10) not null,
        dob date not null,
        email varchar(50) not null,
        phone varchar(10) not null,
        address varchar(100),
        foreign key (userid) references users (userid) on delete cascade,
        primary key (userid));`,
    drop_students_table:
        `drop table if exists students;`,
    delete_students_with_id: //(userid)
        `delete from students where userid = ?;`,
    select_all_students:
        `select * from students order by userid;`,
    select_all_students_with_course: //(course)
        `select * from students where course = ? order by userid;`,
    select_students_with_id: //(userid)
        `select * from students where userid = ?;`,
    insert_students_table: //(userid,name,course,dob,email,phone,address)
        `insert into students ( userid, name, course, dob, email, phone, address ) values ( ?, ?, ?, ?, ?, ?, ? );`,
    update_students_with_id: (feild_name) => { //(feild_value,userid)
        if (["name", "course", "dob", "email", "phone", "address"].includes(feild_name))
            return `update students set ${feild_name} = ? where userid = ?;`;
    },
    create_teachers_table:
        `create table if not exists teachers (
        userid int(8) unsigned not null,
        name varchar(50) not null,
        course varchar(10) not null,
        dob date not null,
        email varchar(50) not null,
        phone varchar(10) not null,
        address varchar(100),
        foreign key (userid) references users (userid) on delete cascade,
        primary key (userid));`,
    drop_teachers_table:
        `drop table if exists teachers;`,
    delete_teachers_with_id: //(userid)
        `delete from teachers where userid = ?;`,
    select_all_teachers:
        `select * from teachers order by userid;`,
    select_teachers_with_id: //(userid)
        `select * from teachers where userid = ?;`,
    insert_teachers_table: //(userid,name,course,dob,email,phone,address)
        `insert into teachers ( userid, name, course, dob, email, phone, address ) values ( ?, ?, ?, ?, ?, ?, ? );`,
    update_teachers_with_id: (feild_name) => { //(feild_value,userid)
        if (["name", "course", "dob", "email", "phone", "address"].includes(feild_name))
            return `update teachers set ${feild_name} = ? where userid = ?;`;
    },
    create_question_papers_table:
        `create table if not exists question_papers (
        filename varchar(50) not null,
        course varchar(10) not null,
        marks int(4) unsigned not null,
        active boolean not null,
        modified_date date not null,
        primary key (filename));`,
    drop_question_papers_table:
        `drop table if exists question_papers;`,
    delete_question_papers_with_name: //(filename)
        `delete from question_papers where filename = ?;`,
    select_all_question_papers:
        `select * from question_papers order by modified_date desc, course;`,
    select_all_question_papers_with_course: //(course)
        `select * from question_papers where course = ? order by modified_date desc;`,
    select_question_papers_with_course_active: //(course)
        `select * from question_papers where active = true and course = ?;`,
    select_question_paper_with_id: //(userid)
        `select * from asnainmiamxe_snheeiel where userid = ? order by modified_date desc;`,
    select_question_papers_with_name: //(filename)
        `select * from question_papers where filename = ?;`,
    insert_question_papers_table: //(filename,course,marks)
        `insert into question_papers ( filename, course, marks, active, modified_date ) values ( ?, ?, ?, false, current_date );`,
    update_question_papers_with_name: //(active,filename)
        `update question_papers set active = ?, modified_date = current_date where filename = ?;`,
    update_all_question_papers_in_course_except_name: //(course, filename)
        `update question_papers set active = false where course = ? and filename != ?;`,
    create_answer_papers_table:
        `create table if not exists answer_papers (
        question_filename varchar(50) not null,
        userid int(8) unsigned not null,
        marks int(4) unsigned,
        submit_date date not null,
        foreign key (question_filename) references question_papers (filename) on delete cascade,
        foreign key (userid) references users (userid) on delete cascade,
        primary key ( question_filename, userid ));`,
    drop_answer_papers_table:
        `drop table if exists answer_papers;`,
    delete_all_answer_papers:
        `delete from answer_papers;`,
    delete_answer_papers_with_Qname_id: //(question_filename,userid)
        `delete from answer_papers where question_filename = ? and userid = ?;`,
    select_all_answer_papers:
        `select * from answer_papers order by submit_date desc, userid;`,
    select_all_answer_papers_with_Qname: //(question_filename)
        `select * from answer_papers where question_filename = ? order by submit_date desc, userid;`,
    select_all_answer_paper_with_course: //(course)
        `select * from asnainmiamxe_snheeiel where course = ? order by userid;`,
    select_all_answer_papers_with_id: //(userid)
        `select * from answer_papers where userid = ? order by submit_date desc;`,
    select_answer_papers_with_Qname_id: //(question_filename,userid)
        `select * from answer_papers where question_filename = ? and userid = ?;`,
    insert_answer_papers_table: //(question_filename,userid)
        `insert into answer_papers ( question_filename, userid, submit_date ) values ( ?, ?, current_date );`,
    update_answer_papers_table: //(marks,question_filename,userid) => {
        `update answer_papers set marks = ? where question_filename = ? and userid = ?;`,
    select_all_results_with_id: //(userid)
        `select question_filename, answer_papers.marks as marks_obtained, submit_date, course, question_papers.marks as full_marks from answer_papers, question_papers where answer_papers.userid = ? and answer_papers.marks is not null and question_filename = filename order by submit_date desc, course;`,
};

module.exports = sql_commands;
