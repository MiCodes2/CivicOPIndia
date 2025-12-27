curl -X POST http://localhost:3000/api/activities/view \
  -H "Content-Type: application/json" \
  -d '{"activityId": 27, "visitorId":"test_visitor_manual"}'