### Run

```bash
nodemon --config nodemon-emails.json
```

### Links

- http://localhost:3003/welcome?data={%22name%22:%22Moshe%22}
- http://localhost:3003/mentorship-accepted?data={%22menteeName%22:%22Moshe%22,%22mentorName%22:%20%22Brent%22,%22contactURL%22:%20%22https%22}
- http://localhost:3003/mentorship-rejected?data={%22menteeName%22:%22Moshe%22,%22mentorName%22:%22Brent%22,%22reason%22:%22because%22}
- http://localhost:3003/mentorship-requested?data={%22name%22:%22Moshe%22,%22mentorName%22:%22Brent%22,%22message%22:%22because%22}