import React, { useState, useEffect} from 'react';
import './App.css';

const App = () => {
  //used to set Audio context or webkitAudio in case AudioContext isn't available
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  //hooks
  const [ctx, setCtx] = useState(new AudioContext());


  //values used to mutate sounds
  let typeOfSound = 'sine';
  let delayTime = 0;
  let distAmount = 0;
  let overSample = 'none'


  //create distortion for plugin
  const dist = ctx.createWaveShaper();
  //create analyzer to draw out visualizer
  const visual = ctx.createAnalyser();
  visual.fftSize = 4096;
  visual.smoothingTimeConstant = 1;

  let bufferLength = visual.frequencyBinCount;
  let dataArray = new Uint8Array(bufferLength);
  visual.getByteTimeDomainData(dataArray);

  let canvas;
  let canvasCtx;
  setTimeout(() => {
    canvas = document.getElementById('visualizer');
    canvasCtx = canvas.getContext('2d');
  }, 500)

  const draw = () => {

    requestAnimationFrame(draw);

    visual.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'white';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvas.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    let sliceWidth = canvas.width * 2.0 / bufferLength;
    let x = 0;

    for (var i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0;
      let y = v * canvas.height / 2;

      if (i === 0) {
        canvasCtx.moveTo(x,y);
      } else {
        canvasCtx.lineTo(x,y);
      }

      x += sliceWidth;
    }
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }

  setTimeout(() => {
    draw()
  }, 1000);


  //set params
  const setNoise = (e) => {
    typeOfSound = (e.target.value);
  }

  const setDelay = (e) => {
    delayTime = Number(e.target.value);
  }

  const setDist = (e) => {
    distAmount = Number(e.target.value);
  }

  const setOverSample = (e) => {
    overSample = (e.target.value);
  }

  //generateDistortion
  const generateDist = (amount) => {
    var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
  }


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

    //values that control distortion on notes
    dist.curve = generateDist(distAmount);
    dist.oversample= overSample;

    // console.log(note, velocity);
    const osc = ctx.createOscillator();

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.05;

    const velGainAmount = (1 / 127) * velocity;
    const velGain = ctx.createGain();
    velGain.gain.value = velGainAmount;

    if (delayTime !== 0) {
      //to set boost lower if distortion is present
      if (distAmount !== 0) {
        oscGain.gain.value = 0.005;
      } else {
        oscGain.gain.value = 0.05;
      }
      //to generate and run additional channel to act as a dealy
      const oscDelay = new DelayNode(ctx, {
        delayTime: delayTime,
        maxDelayTime: 15,
      });

      osc.type = typeOfSound;
      osc.frequency.value = midiFreq(note);

      // osc.connect(oscGain);
      // oscGain.connect(velGain);
      // velGain.connect(oscDelay);
      // oscDelay.connect(ctx.destination);
      // velGain.connect(ctx.destination);

      osc.connect(oscGain).connect(velGain).connect(dist).connect(ctx.destination);
      osc.connect(oscGain).connect(velGain).connect(oscDelay).connect(dist).connect(ctx.destination);

      osc.gain = oscGain;
      oscs[note.toString()] = osc;
      osc.start();
    } else {
      if (distAmount !== 0) {
        oscGain.gain.value = 0.005;
      } else {
        oscGain.gain.value = 0.05;
      }
      //to run without extra delay channel going to speakers
      osc.type = typeOfSound;
      osc.frequency.value = midiFreq(note);

      // osc.connect(oscGain);
      // oscGain.connect(velGain);
      // velGain.connect(dist);
      // dist.connect(ctx.destination);

      osc.connect(oscGain).connect(velGain).connect(dist).connect(visual).connect(ctx.destination);

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

  }, [])

  return (
    <>
    <button type='button' className='btn btn-outline-primary' onClick={generateCtx}>Start</button>
    <button type='button' className='btn btn-outline-success' onClick={setNoise} value="sine">Sine</button>
    <button type='button' className='btn btn-outline-success' onClick={setNoise} value="square">Square</button>
    <button type='button' className='btn btn-outline-success' onClick={setNoise} value="sawtooth">Sawtooth</button>
    <button type='button' className='btn btn-outline-success' onClick={setNoise} value="triangle">Triangle</button>
    <div className='container'>
      <div className='row'>
        <div className='col-lg-4'>
          <div className='form-floating'>
            <select className='form-select' onChange={setDelay} name='delay' id='delay'>
              <option value='0.0'>None</option>
              <option value='0.25'>Fast</option>
              <option value='0.5'>Medium</option>
              <option value='0.75'>Slow</option>
            </select>
            <label htmlFor='delay'>Delay Time</label>
          </div>
        </div>
        <div className='col-lg-4'>
          <div className='form-floating'>
            <select className='form-select' onChange={setDist} name='dist' id='dist'>
              <option value='0'>None</option>
              <option value='1600'>Phat</option>
              <option value='200'>Medium</option>
              <option value='50'>Thin</option>
            </select>
            <label htmlFor='dist'>Distortion</label>
          </div>
        </div>
        <div className='col-lg-4'>
          <div className='form-floating'>
            <select className='form-select' onChange={setOverSample} name='overSample' id='overSample'>
              <option value='none'>None</option>
              <option value='2x'>2x</option>
              <option value='4x'>4x</option>
            </select>
            <label htmlFor='overSample'>Oversampling</label>
          </div>
        </div>
      </div>
    </div>
    <div className='container'>
      <div className='row text-center'>
        <div className='col-12-sm'>
          <canvas id='visualizer' style={{Height: '500px', Width: '500px'}}>my canvas</canvas>
        </div>
      </div>

    </div>

    </>
  );
}

export default App;
