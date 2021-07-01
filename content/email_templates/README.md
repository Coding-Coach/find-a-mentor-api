### Run

```bash
nodemon --config nodemon-emails.json
```

### Links

|||
|--- |--- |
|Welcome|http://localhost:3003/welcome?data={%22name%22:%22Moshe%22}|
|Mentorship accepted|http://localhost:3003/mentorship-accepted?data={%22menteeName%22:%22Moshe%22,%22mentorName%22:%20%22Brent%22,%22contactURL%22:%20%22https%22}|
|Mentorship declined|http://localhost:3003/mentorship-declined?data={%22menteeName%22:%22Moshe%22,%22mentorName%22:%22Brent%22,%22reason%22:%22because%22}|
|Mentorship cancelled|http://localhost:3003/mentorship-cancelled?data={%22menteeName%22:%22Moshe%22,%22mentorName%22:%20%22Brent%22,%22reason%22:%20%22I%27ve%20already%20found%20a%20mentor%22}|
|Mentorship requested|http://localhost:3003/mentorship-requested?data={%22name%22:%22Moshe%22,%22mentorName%22:%22Brent%22,%22message%22:%22because%22}|
|Mentor application received|http://localhost:3003/mentor-application-received?data={%22name%22:%22Brent%22}|
|Mentorship application denied|http://localhost:3003/mentor-application-declined?data={%22name%22:%22Moshe%22,%22reason%22:%22your%20avatar%20is%20not%20you%22}|
|Mentorship application approved|http://localhost:3003/mentor-application-approved?data={%22name%22:%22Moshe%22}|