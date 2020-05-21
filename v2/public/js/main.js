let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');
let selectRoom = document.getElementById('selectRoom');
let consultRoom = document.getElementById('consultingRoom');
let inputRoomNumber = document.getElementById('roomNumber');
let btnGo = document.getElementById('goRoom');



let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller, dataChannel;


const iceServers = {
    'iceServer': [  
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'}
    ]
}

const streamConstraints = {
    audio: true,
    video: true
}

// to connect with signalling server in the backend
const socket = io()

btnGo.onclick = () => {
    if(inputRoomNumber.value === ''){
        alert("Room number missing!");
    } else {
        roomNumber = inputRoomNumber.value
        socket.emit('create or join', roomNumber)
        selectRoom.style.display = "none";
        consultRoom.style.display = "block";
    }
}


// event emitted from backend is received here
socket.on('created', room => {
    navigator.mediaDevices.getUserMedia(streamConstraints)
        .then(stream => {
            localStream = stream
            localVideo.srcObject = stream
            isCaller = true // because room was created by this user.
        })
        .catch(err => {
            console.log("There was an error!");
        })
})

socket.on('joined', room => {
    navigator.mediaDevices.getUserMedia(streamConstraints)
        .then(stream => {
            localStream = stream
            localVideo.srcObject = stream
            socket.emit('ready', roomNumber)
            // this user joined an existing room
        })
        .catch(err => {
            console.log("There was an error!");
        })
})

// receive from backend
socket.on('ready', () => {
    if(isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream) // sending video track
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream) // sending audio track

        // creating offer
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                console.log('Sending offer', sessionDescription);
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                })
            })
            .catch(err => {
                console.log(err);
            })
            dataChannel = rtcPeerConnection.createDataChannel(roomNumber)
            dataChannel.onmessage = event => { h2CallName.innerText = event.data }
    }
})


// received from backend broadcast, event refers to event.sdp
socket.on('offer', (event) => {
    // not caller, means other users have to receive this
    if(!isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream) // sending video track
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream) // sending audio track

        console.log('Received offer', event);


        // setting the remote description for new user as the session description defined in offer
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))

        // creating answer
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                console.log('Sending answer', sessionDescription);
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                })
            })
            .catch(err => {
                console.log(err);
            })

            rtcPeerConnection.ondatachannel = event => {
                dataChannel = event.channel
                dataChannel.onmessage = event => { h2CallName.innerText = event.data }
            }
    }
})

// all users should receive the answer

socket.on('answer', event => {
    console.log('Received answer', event);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

socket.on('candidate', event => {
    const candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    console.log('Received candidate', candidate);
    rtcPeerConnection.addIceCandidate(candidate);
})


function onAddStream(event){
    remoteVideo.srcObject = event.streams[0]
    remoteStream = event.streams[0]
}

// when ice candidate is found
function onIceCandidate(event){
    if(event.candidate) {
        console.log('sending ice candidate', event.candidate);
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}
