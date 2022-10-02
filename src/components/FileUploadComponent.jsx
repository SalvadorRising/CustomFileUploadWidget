import { useState, createElement, useEffect } from "react";

function base64ArrayBuffer(arrayBuffer) {
	var base64    = ''
	var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  
	var bytes         = new Uint8Array(arrayBuffer)
	var byteLength    = bytes.byteLength
	var byteRemainder = byteLength % 3
	var mainLength    = byteLength - byteRemainder
  
	var a, b, c, d
	var chunk
  
	// Main loop deals with bytes in chunks of 3
	for (var i = 0; i < mainLength; i = i + 3) {
	  // Combine the three bytes into a single integer
	  chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
  
	  // Use bitmasks to extract 6-bit segments from the triplet
	  a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
	  b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
	  c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
	  d = chunk & 63               // 63       = 2^6 - 1
  
	  // Convert the raw binary segments to the appropriate ASCII encoding
	  base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
	}
  
	// Deal with the remaining bytes and padding
	if (byteRemainder == 1) {
	  chunk = bytes[mainLength]
  
	  a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
  
	  // Set the 4 least significant bits to zero
	  b = (chunk & 3)   << 4 // 3   = 2^2 - 1
  
	  base64 += encodings[a] + encodings[b] + '=='
	} else if (byteRemainder == 2) {
	  chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
  
	  a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
	  b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4
  
	  // Set the 2 least significant bits to zero
	  c = (chunk & 15)    <<  2 // 15    = 2^4 - 1
  
	  base64 += encodings[a] + encodings[b] + encodings[c] + '='
	}
	
	return base64
  }

function getUInt8Chunk(file, start, end) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = reject;
		const slice = file.slice(start, end);
        reader.readAsArrayBuffer(slice);
    });
}

export function FileUploadComponent(props) {

	const chunkSize = 9999999; // must be a multiple of 3 for succesful base64 conversion

    const [selectedFile, setSelectedFile] = useState();
	const [isFilePicked, setIsFilePicked] = useState(false);

	const [chunk, setChunk] = useState(1);
	const [start, setStart] = useState(0);
	const [end, setEnd] = useState(chunkSize);

	const [uploadStarted, setUploadStarted] = useState(false);
	const [uploadFinished, setUploadFinished] = useState(false);

    const changeHandler = (event) => {
		setSelectedFile(event.target.files[0]);
		setIsFilePicked(true);
	};

	const uploadPendingChunk = () => {

		var uploadKey = props.identifierAttribute.value.split("/")[0];

		var promise = getUInt8Chunk(selectedFile, start, end); // get specific chunk of the file to upload as an UInt8Array
		promise.then(function(UInt8Data) {
			
			if (UInt8Data.byteLength == 0) {
				console.log("Finished Upload");
				setUploadStarted(false);
				setUploadFinished(true);
				return;
			}

			const base64Data = base64ArrayBuffer(UInt8Data); // convert the UInt8Array into a Base64 string so we can send it via REST
			
			props.identifierAttribute.setValue(uploadKey + '/' + chunk.toString()); // set the uploaded file R2 ID, this will be a folder in the top level bucket directory
			props.contentAttribute.setValue(base64Data); // set the data to upload as the base64 representation of the chunk
			if (props.uploadMicroflow.canExecute && !props.uploadMicroflow.isExecuting) {
				props.uploadMicroflow.execute(); // execute the microflow which uploads the chunk as an individual file on R2
				setChunk(chunk + 1);
				setStart(end);
				setEnd(end + chunkSize);
			}
		});
	}

	useEffect(() => {
		if (uploadStarted && !props.uploadMicroflow.isExecuting) {
			uploadPendingChunk();
		}
	}, [props.uploadMicroflow.isExecuting]);

    const handleSubmission = () => {
		console.log("File Submitted");

		props.fileTypeAttribute.setValue(selectedFile.type); // set the file type attribute so we know what file this is when we download it

		setUploadStarted(true);
		setUploadFinished(false);
		uploadPendingChunk();
	};

	return (
        <div>
			<input type="file" name="file" onChange={changeHandler} />
			{isFilePicked ? (
				<div>
					<p>Filename: {selectedFile.name}</p>
					<p>Filetype: {selectedFile.type}</p>
					<p>Size in bytes: {selectedFile.size}</p>
					{((!uploadStarted && !uploadFinished) ? (<p>Status: Ready for upload</p>) : (<p></p>))}
					{((uploadStarted && chunk != 1) ? (<p>Status: Uploading Chunk {chunk-1}/{Math.ceil(selectedFile.size / chunkSize)}</p>) : (<p></p>))}
					{((!uploadStarted && uploadFinished) ? (<p>Status: Upload complete</p>) : (<p></p>))}
				</div>
			) : (
				<p>Select a file to show details</p>
			)}
			<div>
				<button onClick={handleSubmission}>Submit</button>
			</div>
		</div>
	)
}
