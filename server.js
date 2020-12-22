let fs = require('fs');
let express = require('express');

let rawData = fs.readFileSync('drivers_karts_BackJ.json');

let parsedData = JSON.parse(rawData);

console.log('Server starting');

let app = express();
app.listen(3000);

app.get('/generalRaces', sendGeneralRaces);

let pointArray = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

function sendGeneralRaces(request, response) {
  let returned = parsedData.map((p) => {
    return {
      name: p.name,
      fastestLapsAllRaces: p.races.map(
        (r) =>
          +r.laps
            .map(
              (l) =>
                +l.time.split(':')[0] * 10 +
                +l.time.split(':')[1] * 10 +
                +l.time.split(':')[2]
            )
            .sort((f, s) => f - s)
            .shift()
            .toFixed(3)
      ),

      totalTimeEachRace: p.races.map(
        (r) =>
          +r.laps
            .map(
              (l) =>
                +l.time.split(':')[0] * 60 +
                +l.time.split(':')[1] * 10 +
                +l.time.split(':')[2]
            )
            .reduce((f, s) => f + s)
            .toFixed(3)
      ),

      totalTime: p.races
        .map(
          (r) =>
            +r.laps
              .map(
                (l) =>
                  +l.time.split(':')[0] * 60 +
                  +l.time.split(':')[1] * 10 +
                  +l.time.split(':')[2]
              )
              .reduce((f, s) => f + s)
        )
        .reduce((f, s) => f + s)
        .toFixed(3),
      points: 0,
    };
  });

  returned = generatePoints(returned);

  response.send(returned.sort((f, s) => s.points - f.points));
}

app.get('/oneRace/:raceNumber', sendOneRace);

function sendOneRace(request, response) {
  const numberOfRace = +request.params.raceNumber;

  if (isNaN(numberOfRace))
    return response.send('Introduzca solo el numero de la carrera');

  let fastestLapRace = parsedData.map((p) => {
    return {
      totalLapsTime: p.races[numberOfRace].laps
        .map(
          (l) =>
            +l.time.split(':')[0] * 60 +
            +l.time.split(':')[1] * 10 +
            +l.time.split(':')[2]
        )
        .reduce((f, s) => f + s, 0)
        .toFixed(3),

      name: p.name,
    };
  });

  fastestLapRace.sort((a, b) => a.totalLapsTime - b.totalLapsTime);

  const result = parsedData
    .map((p) => {
      return {
        name: p.name,
        totalTime: +p.races[numberOfRace].laps
          .map(
            (l) =>
              +l.time.split(':')[0] * 60 +
              +l.time.split(':')[1] * 10 +
              +l.time.split(':')[2]
          )
          .reduce((f, s) => f + s, 0)
          .toFixed(3),

        fastestTime: +p.races[numberOfRace].laps
          .map(
            (l) =>
              +l.time.split(':')[0] * 60 +
              +l.time.split(':')[1] * 10 +
              +l.time.split(':')[2]
          )
          .sort((f, s) => f - s)[0]
          .toFixed(3),

        points:
          pointArray[fastestLapRace.findIndex((f) => f.name === p.name)] || 0,
      };
    })
    .sort((a, b) => a.fastestTime - b.fastestTime);

  result[0].points += 1;
  result.sort((a, b) => b.points - a.points);

  response.send(result);
}

app.get('/onePilot/:pilotName', onePilot);

function onePilot(request, response) {
  let returned = parsedData.map((p) => {
    return {
      name: p.name,
      fastestLapsAllRaces: p.races
        .map((r) =>
          r.laps
            .map(
              (l) =>
                +(
                  +l.time.split(':')[0] * 60 +
                  +l.time.split(':')[1] * 10 +
                  +l.time.split(':')[2]
                )
            )
            .sort((f, s) => f - s)
            .shift()
        )
        .map((fastestLap, i) => ({
          race: `Race ${i}`,
          fastestLap,
        })),

      totalTimeEachRace: p.races.map(
        (r) =>
          +r.laps
            .map(
              (l) =>
                +l.time.split(':')[0] * 60 +
                +l.time.split(':')[1] * 10 +
                +l.time.split(':')[2]
            )
            .reduce((f, s) => f + s)
            .toFixed(3)
      ),

      totalTime: p.races
        .map(
          (r) =>
            +r.laps
              .map(
                (l) =>
                  +l.time.split(':')[0] * 60 +
                  +l.time.split(':')[1] * 10 +
                  +l.time.split(':')[2]
              )
              .reduce((f, s) => f + s)
        )

        .reduce((f, s) => f + s)
        .toFixed(3),
      points: 0,
    };
  });

  returned = generatePoints(returned, true);

  returned = returned.map((i) => ({
    ...i,
    totalTimeEachRace: undefined,
    fastestLapsAllRaces: i.fastestLapsAllRaces.map((f, index) => ({
      ...f,
      totalTime: i.totalTimeEachRace[index],
    })),
  }));

  let onePilotName = returned.find((f) => f.name === request.params.pilotName);
  if (!onePilotName) return response.send('Ese piloto no existe');
  response.send(onePilotName);
}

function generatePoints(jsonInput, hasRaceEnumeration = false) {
  const jsonObject = [...jsonInput];
  let eachRaceFastLap = [];
  let eachRaceTotalTime = [];
  let eachRaceTotalTimeUnsorted = [];
  let indexArray = [];

  for (let cont = 0; cont < 10; cont++) {
    jsonObject.map((p) => {
      eachRaceFastLap.push(p.fastestLapsAllRaces[cont]);
      eachRaceTotalTime.push(p.totalTimeEachRace[cont]);
      eachRaceTotalTimeUnsorted.push(p.totalTimeEachRace[cont]);
    });

    eachRaceTotalTime.sort((f, s) => f - s);
    eachRaceTotalTime = eachRaceTotalTime.slice(0, 10);

    for (let cont3 = 0; cont3 < eachRaceTotalTime.length; cont3++) {
      indexArray.push(
        eachRaceTotalTimeUnsorted.indexOf(eachRaceTotalTime[cont3])
      );
    }

    for (let cont = 0; cont < 10; cont++) {
      jsonObject[indexArray[cont]].points += pointArray[cont];
    }

    if (hasRaceEnumeration) {
      const eachRaceFastLapMapped = eachRaceFastLap.map((e) => e.fastestLap);
      jsonObject[
        eachRaceFastLapMapped.indexOf(Math.min(...eachRaceFastLapMapped))
      ].points += 1;
    } else {
      jsonObject[
        eachRaceFastLap.indexOf(Math.min(...eachRaceFastLap))
      ].points += 1;
    }

    eachRaceFastLap = [];
    eachRaceTotalTime = [];
    eachRaceTotalTimeUnsorted = [];
    indexArray = [];
  }

  return jsonObject;
}
