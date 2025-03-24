from modules.autorization import autorizate

from modules.products import makeProducts, makeFillSheet, get_relation_json, excel_to_dict

import pandas as pd

import requests

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# cert_path = './1007383757.pfx'
# cert_psw = 'jlmarine2025'

@app.route('/', methods=['GET'])
def home():
    return 'Hi Vercel!'

# @app.route('/get-products', methods=['POST'])
# def getProducts():
#     set_token, csrf_token = None, None
#     print('requisição recebida')
#     raiz = request.args.get('root')

#     if not set_token:
#             set_token, csrf_token = autorizate(cert_path, cert_psw, prod=True).values()
        
#     root_url = 'https://portalunico.siscomex.gov.br'
#     get_products_url = f'{root_url}/catp/api/ext/produto'

    # Cabeçalhos da requisição
    # headers = {
    #     "Content-Type": "application/json",
    #     "Authorization": set_token, 
    #     "X-CSRF-Token": csrf_token
    # }
    # products = []

    # filters = {
    #     'cpfCnpjRaiz': raiz
    # }

    # try:
    #     # Enviando o POST request
    #     response = requests.get(get_products_url, headers=headers, params=filters)

    #     # Verificando o status da resposta
    #     if response.status_code == 200:
    #         print("Requisição enviada com sucesso!")
    #         products = response.json()

    #     else:
    #         print(f"Erro ao enviar requisição: {response.status_code}")
    #         print("Detalhes:", response.text)

    # except requests.exceptions.RequestException as e:
    #     print(f"Erro na conexão: {e}")
    # return jsonify(products)

@app.route('/make-sheet', methods=['POST'])
def makeSheet():
    set_token, csrf_token = None, None
    # Verifica se a requisição contém o arquivo
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']

    # Verifica se o arquivo não foi enviado vazio
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    df = pd.read_excel(file)
    
    set_token, csrf_token = request.headers['set-token'], request.headers['csrf-token']

    # print(set_token, csrf_token)
    
    relation_json = get_relation_json(prod=True, set_token=set_token, csrf_token=csrf_token)
    print(df.head())
    generated_file = makeFillSheet(df, relation_json)

    return send_file(
        generated_file,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='fill_sheet.xlsx'
    )


@app.route('/authenticate-certificate', methods=['POST'])
def autenticateCertificate():

    certificate_file = request.files['file']
    certificate_password = request.headers['Password']
    
    auth_response = autorizate(certificate_file, certificate_password, prod=True)

    print(auth_response)

    if auth_response.get('status') == 'ok':
        return jsonify(auth_response), 200
    else:
        return jsonify(auth_response), 400

if __name__ == '__main__':
    app.run()