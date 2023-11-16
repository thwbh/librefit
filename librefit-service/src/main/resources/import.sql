-- default dev user with pwd 'test1'
insert into libre_user (registered, id, avatar, email, name, password, role)
values (NOW(),'b21291e5-db51-4a52-a997-25f4021c0ac6','/assets/images/avatars/dog-1.png','test1@test.dev','Testuser 1','$2a$10$sFGAyHJY3jWxLjhkr7q8B.DdzYL5v4CqTDlW1iVQhPOrSN9UEqoBe','User');


insert into calorie_tracker_entry (added, sequence, user_id, amount, category)
values ('2023-02-01', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-01', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 270, 'l'),
       ('2023-02-01', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 900, 'd'),
       ('2023-02-01', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 518, 's'),
       ('2023-02-02', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-02', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'l'),
       ('2023-02-02', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 500, 'd'),
       ('2023-02-02', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 600, 's'),
       ('2023-02-03', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-03', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'l'),
       ('2023-02-03', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 450, 'd'),
       ('2023-02-03', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 's'),
       ('2023-02-04', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-04', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 900, 'l'),
       ('2023-02-04', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 577, 'd'),
       ('2023-02-04', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 450, 's'),
       ('2023-02-05', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-05', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 950, 'l'),
       ('2023-02-05', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 535, 'd'),
       ('2023-02-05', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 142, 's'),
       ('2023-02-06', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-06', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 375, 'l'),
       ('2023-02-06', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1000, 'd'),
       ('2023-02-06', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 320, 's'),
       ('2023-02-07', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-07', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 450, 'l'),
       ('2023-02-07', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1400, 'd'),
       ('2023-02-07', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 160, 's'),
       ('2023-02-08', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-08', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 450, 'l'),
       ('2023-02-08', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'd'),
       ('2023-02-08', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 890, 's'),
       ('2023-02-09', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-09', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 900, 'l'),
       ('2023-02-09', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 550, 'd'),
       ('2023-02-09', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 160, 's'),
       ('2023-02-10', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 600, 'b'),
       ('2023-02-10', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 810, 'l'),
       ('2023-02-10', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 346, 'd'),
       ('2023-02-10', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 160, 's'),
       ('2023-02-11', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 160, 'b'),
       ('2023-02-11', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'l'),
       ('2023-02-11', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 850, 'd'),
       ('2023-02-11', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 400, 's'),
       ('2023-02-12', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-12', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 950, 'l'),
       ('2023-02-12', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 600, 'd'),
       ('2023-02-12', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 160, 's'),
       ('2023-02-13', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-13', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 750, 'l'),
       ('2023-02-13', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 627, 'd'),
       ('2023-02-13', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 160, 's'),
       ('2023-02-14', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-14', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 560, 'l'),
       ('2023-02-14', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 600, 'd'),
       ('2023-02-14', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 640, 's'),
       ('2023-02-15', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 480, 'b'),
       ('2023-02-15', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 560, 'l'),
       ('2023-02-15', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 750, 'd'),
       ('2023-02-15', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 160, 's'),
       ('2023-02-16', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-16', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'l'),
       ('2023-02-16', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'd'),
       ('2023-02-16', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 139, 's'),
       ('2023-02-17', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-17', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 950, 'l'),
       ('2023-02-17', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 605, 'd'),
       ('2023-02-17', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 160, 's'),
       ('2023-02-18', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-18', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'l'),
       ('2023-02-18', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 700, 'd'),
       ('2023-02-18', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 600, 's'),
       ('2023-02-19', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 376, 'b'),
       ('2023-02-19', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'l'),
       ('2023-02-19', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'd'),
       ('2023-02-19', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 600, 's'),
       ('2023-02-20', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-20', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 600, 'l'),
       ('2023-02-20', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 810, 'd'),
       ('2023-02-20', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 160, 's'),
       ('2023-02-21', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'b'),
       ('2023-02-21', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'l'),
       ('2023-02-21', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 750, 'd'),
       ('2023-02-21', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 900, 's'),
       ('2023-02-22', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-22', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'l'),
       ('2023-02-22', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 730, 'd'),
       ('2023-02-22', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 160, 's'),
       ('2023-02-23', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-23', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1000, 'l'),
       ('2023-02-23', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 600, 'd'),
       ('2023-02-23', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 285, 's'),
       ('2023-02-24', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-24', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 450, 'l'),
       ('2023-02-24', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1200, 'd'),
       ('2023-02-24', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 760, 's'),
       ('2023-02-25', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 450, 'b'),
       ('2023-02-25', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'l'),
       ('2023-02-25', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'd'),
       ('2023-02-25', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 700, 's'),
       ('2023-02-26', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-26', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 400, 'l'),
       ('2023-02-26', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 750, 'd'),
       ('2023-02-26', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 369, 's'),
       ('2023-02-27', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-27', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 700, 'l'),
       ('2023-02-27', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 840, 'd'),
       ('2023-02-27', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 160, 's'),
       ('2023-02-28', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-02-28', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'l'),
       ('2023-02-28', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 660, 'd'),
       ('2023-02-28', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 400, 's');

insert into weight_tracker_entry (added, sequence, user_id, amount)
values ('2023-02-01', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 100),
       ('2023-02-02', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 100),
       ('2023-02-03', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 100),
       ('2023-02-04', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 100),
       ('2023-02-05', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 100),
       ('2023-02-06', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 100),
       ('2023-02-07', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 100),
       ('2023-02-08', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 100),
       ('2023-02-09', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 99),
       ('2023-02-10', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 99),
       ('2023-02-11', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 99),
       ('2023-02-12', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 99),
       ('2023-02-13', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 99),
       ('2023-02-14', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 98),
       ('2023-02-15', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 98),
       ('2023-02-16', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 98),
       ('2023-02-17', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 98),
       ('2023-02-18', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-02-19', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-02-20', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-02-21', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-02-22', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-02-23', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-02-24', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-02-25', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-02-26', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-02-27', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-02-28', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97);


insert into calorie_tracker_entry (added, sequence, user_id, amount, category)
values ('2023-03-01', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 0, 'b'),
       ('2023-03-01', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'l'),
       ('2023-03-01', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1200, 'd'),
       ('2023-03-02', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-02', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 450, 'l'),
       ('2023-03-02', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1000, 'd'),
       ('2023-03-02', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 180, 's'),
       ('2023-03-03', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-03', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 750, 'l'),
       ('2023-03-03', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1200, 'd'),
       ('2023-03-04', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-04', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1200, 'l'),
       ('2023-03-04', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'd'),
       ('2023-03-05', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-05', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 700, 'l'),
       ('2023-03-05', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 700, 'd'),
       ('2023-03-06', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-06', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1000, 'l'),
       ('2023-03-06', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 643, 'd'),
       ('2023-03-06', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 139, 's'),
       ('2023-03-07', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-07', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 643, 'l'),
       ('2023-03-07', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 820, 'd'),
       ('2023-03-07', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 139, 's'),
       ('2023-03-08', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-08', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1250, 'l'),
       ('2023-03-08', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 350, 'd'),
       ('2023-03-09', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-09', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 750, 'l'),
       ('2023-03-09', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 750, 'd'),
       ('2023-03-09', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 400, 's'),
       ('2023-03-10', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 300, 'b'),
       ('2023-03-10', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 750, 'l'),
       ('2023-03-10', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 900, 'd'),
       ('2023-03-11', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 440, 'b'),
       ('2023-03-11', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'l'),
       ('2023-03-11', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 900, 'd'),
       ('2023-03-11', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 359, 's'),
       ('2023-03-12', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-12', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 850, 'l'),
       ('2023-03-12', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 300, 'd'),
       ('2023-03-12', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 400, 's'),
       ('2023-03-13', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-13', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 850, 'l'),
       ('2023-03-13', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 565, 'd'),
       ('2023-03-13', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 300, 's'),
       ('2023-03-14', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-14', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'l'),
       ('2023-03-14', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'd'),
       ('2023-03-14', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 284, 's'),
       ('2023-03-15', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-15', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 700, 'l'),
       ('2023-03-15', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 600, 'd'),
       ('2023-03-16', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-16', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1200, 'l'),
       ('2023-03-16', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 400, 'd'),
       ('2023-03-17', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-17', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 400, 'l'),
       ('2023-03-17', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 2400, 'd'),
       ('2023-03-18', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 0, 'b'),
       ('2023-03-18', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'l'),
       ('2023-03-18', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'd'),
       ('2023-03-18', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 384, 's'),
       ('2023-03-19', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 383, 'b'),
       ('2023-03-19', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 750, 'l'),
       ('2023-03-19', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'd'),
       ('2023-03-20', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 0, 'b'),
       ('2023-03-20', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 950, 'l'),
       ('2023-03-20', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 562, 'd'),
       ('2023-03-20', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 387, 's'),
       ('2023-03-21', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-21', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 950, 'l'),
       ('2023-03-21', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'd'),
       ('2023-03-21', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 500, 's'),
       ('2023-03-22', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-22', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'l'),
       ('2023-03-22', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1000, 'd'),
       ('2023-03-23', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-23', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1200, 'l'),
       ('2023-03-23', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 600, 'd'),
       ('2023-03-24', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 0, 'b'),
       ('2023-03-24', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 950, 'l'),
       ('2023-03-24', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 950, 'd'),
       ('2023-03-25', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 450, 'b'),
       ('2023-03-25', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 900, 'l'),
       ('2023-03-25', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 900, 'd'),
       ('2023-03-26', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-26', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1000, 'l'),
       ('2023-03-26', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'd'),
       ('2023-03-27', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-27', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 950, 'l'),
       ('2023-03-27', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'd'),
       ('2023-03-28', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-28', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 360, 'l'),
       ('2023-03-28', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 750, 'd'),
       ('2023-03-28', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 700, 's'),
       ('2023-03-29', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 240, 'b'),
       ('2023-03-29', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 650, 'l'),
       ('2023-03-29', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 400, 'd'),
       ('2023-03-29', 4, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 's'),
       ('2023-03-30', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 500, 'b'),
       ('2023-03-30', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 500, 'l'),
       ('2023-03-30', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 900, 'd'),
       ('2023-03-31', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 0, 'b'),
       ('2023-03-31', 2, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 1000, 'l'),
       ('2023-03-31', 3, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 800, 'd');

insert into weight_tracker_entry (added, sequence, user_id, amount)
values ('2023-03-01', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-03-02', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-03-03', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 97),
       ('2023-03-04', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 96),
       ('2023-03-05', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 96),
       ('2023-03-06', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 96),
       ('2023-03-07', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 96),
       ('2023-03-08', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 96),
       ('2023-03-09', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 96),
       ('2023-03-10', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 95),
       ('2023-03-11', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 95),
       ('2023-03-12', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 95),
       ('2023-03-13', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 95),
       ('2023-03-14', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 95),
       ('2023-03-15', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-16', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-17', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-18', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-19', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-20', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-21', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-22', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-23', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-24', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-25', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-26', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-27', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-28', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 94),
       ('2023-03-29', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 93),
       ('2023-03-30', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 93),
       ('2023-03-31', 1, 'b21291e5-db51-4a52-a997-25f4021c0ac6', 93);

insert into goal (user_id, added, sequence, start_date, end_date, initial_weight, target_weight, target_calories, maximum_calories )
    values ('b21291e5-db51-4a52-a997-25f4021c0ac6', '2023-02-01', 1, '2023-02-01', '2024-02-01', 104, 77, 1849, 2398);