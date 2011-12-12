from flask import Flask, render_template

app = Flask(__name__)
app.debug = True

@app.route("/")
def index():
    return render_template('index.template')

@app.route("/unittest")
def unittest():
    return render_template('unittest.template')

if __name__=='__main__':
    app.run(port=8080)
