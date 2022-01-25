import React, { useState, useEffect} from 'react';
import './App.css';

const App = () => {
  //used to set Audio context or webkitAudio in case AudioContext isn't available
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  //hooks
  const [ctx, setCtx] = useState(new AudioContext());

  let typeOfSound = 'sine';
  let delayTime = 0;


  //set params
  const setNoise = (e) => {
    typeOfSound = (e.target.value);
  }

  const setDelay = (e) => {
    delayTime = Number(e.target.value);
  }

  // //generateDistortion
  // const generateDist = (amount) => {
  //   var k = typeof amount === 'number' ? amount : 50,
  //   n_samples = 44100,
  //   curve = new Float32Array(n_samples),
  //   deg = Math.PI / 180,
  //   i = 0,
  //   x;
  //   for ( ; i < n_samples; i++) {
  //     x = i * 2 / n_samples - 1;
  //     curve[i] = ( 3 + k) * x * 20 * deg / ( Math.Pi + k * Math.abs(x) );
  //   }
  //   return curve;
  // }


  //obj to hold all osc's currently running
  const oscs = {};

  const generateCtx = () => {
    let generated = new AudioContext();
    setCtx(generated);
  }

  const midiFreq = (midiNote) => {
    const a = 440;
    return (a / 32) * (2 ** ((midiNote - 9) / 12));
  }

  const noteOn = (note, velocity) => {
    // console.log(note, velocity);
    const osc = ctx.createOscillator();

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.33;

    const velGainAmount = (1 / 127) * velocity;
    const velGain = ctx.createGain();
    velGain.gain.value = velGainAmount;

    if (delayTime !== 0) {
      //to generate and run additional channel to act as a dealy
      const oscDelay = new DelayNode(ctx, {
        delayTime: delayTime,
        maxDelayTime: 15,
      });

      osc.type = typeOfSound;
      osc.frequency.value = midiFreq(note);

      osc.connect(oscGain);
      oscGain.connect(velGain);
      velGain.connect(oscDelay);
      oscDelay.connect(ctx.destination);
      velGain.connect(ctx.destination);

      osc.gain = oscGain;
      oscs[note.toString()] = osc;
      osc.start();
    } else {
      //to run without extra delay channel going to speakers
      osc.type = typeOfSound;
      osc.frequency.value = midiFreq(note);

      osc.connect(oscGain);
      oscGain.connect(velGain);
      velGain.connect(ctx.destination);

      osc.gain = oscGain;
      oscs[note.toString()] = osc;
      osc.start();
    }

    //og setup
    // osc.connect(oscGain);
    // osc.connect(ctx.destination);
    // osc.start();
    // console.log(osc);

  }

  const noteOff = (note) => {
    //re enable to see note being pressed
    // console.log(note);
    const osc = oscs[note.toString()];
    const oscGain = osc.gain;

    oscGain.gain.setValueAtTime(oscGain.gain.value, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    setTimeout(() => {
      osc.stop();
      osc.disconnect();
    }, 20);
    delete oscs[note.toString()];

  }


  const updateDevices = (event) => {
    // console.log(event);
  }

  const handleInput = (input) => {
    const command = input.data[0];
    const note = input.data[1];
    const velocity = input.data[2];
    // console.log(command, note, velocity);
    switch (command) {
      case 144:
      if (velocity > 0) {
        noteOn(note, velocity);
      } else {
        noteOff(note);
      }
      break;
      case 128:
        noteOff(note);
        break;
      default:
        //nope
    }
  }

  const failure = () => {
    console.log('could not connect');
  }

  const success = (midiAccess) => {
    // console.log(midiAccess);
    midiAccess.addEventListener('statechange', updateDevices);

    const inputs = midiAccess.inputs;
    // console.log(inputs);
    inputs.forEach((input) => {
      // console.log(input);
      // input.onmidimessage = handleInput;
      input.addEventListener('midimessage', handleInput);
    })
  }

  navigator.requestMIDIAccess().then(success, failure);

  useEffect(() => {

  }, [typeOfSound])

  return (
    <>
    <button onClick={generateCtx}>Start</button>
    <button onClick={setNoise} value="sine">Sine</button>
    <button onClick={setNoise} value="square">Square</button>
    <button onClick={setNoise} value="sawtooth">Sawtooth</button>
    <button onClick={setNoise} value="triangle">Triangle</button>
    <label htmlFor='delay'>Delay Time</label>
    <select onChange={setDelay} name='delay' id='delay'>
      <option value='0.0'>None</option>
      <option value='0.3'>Fast</option>
      <option value='0.5'>Medium</option>
      <option value='0.7'>Slow</option>
    </select>
    </>
  );
}

export default App;
