uploadLambda:
	zip -r chordifyWrapper.zip .
	aws lambda update-function-code --function-name ChordifyPro --zip-file fileb://chordifyWrapper.zip
