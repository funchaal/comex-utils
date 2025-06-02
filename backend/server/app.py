from modules.autorization import autorizate

from modules.utils import get_relation_json, excel_to_dict, post_payload

from modules.makeFillSheet import makeFillSheet

from modules.makeProductsPayload import makeProductsPayload

import pandas as pd

import redis

import uuid

import time

import json

import requests

from io import BytesIO
from openpyxl import Workbook

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

PROD = True

redis_host = 'redis-14815.c308.sa-east-1-1.ec2.redns.redis-cloud.com'
redis_port = 14815
redis_password = 'qSpLdoECDra4aXg15QxJvX6yShc3f2r4'

r = redis.Redis(
    host=redis_host,
    port=redis_port,
    password=redis_password
    # ssl=True
)

# cert_path = './1007383757.pfx'
# cert_psw = 'jlmarine2025'

@app.route('/consult-products', methods=['GET'])
def consultProducts():
    """
    Requisição JSON:
    {
        "raiz": "12345678"
    }
    Headers:
    - session-id: <uuid>
    """
    raiz = request.args.get('cpfCnpjRaiz')  # pega o parâmetro da query string

    print(raiz)

    if not raiz:
        return jsonify({'error': 'Missing "cpfCnpjRaiz" parameter'}), 400

    raiz = raiz.strip().zfill(8)
    session_id = request.headers.get('session-id')

    print(session_id)

    if not session_id:
        return jsonify({'error': 'Missing "session-id" header'}), 400

    tokens = r.get(session_id)
    if not tokens:
        return jsonify({"error": "Session expired or invalid"}), 401

    tokens = json.loads(tokens)

    set_token = tokens['set-token']
    csrf_token = tokens['x-csrf-token']

    root_url = 'https://portalunico.siscomex.gov.br' if PROD else 'https://val.portalunico.siscomex.gov.br'
    get_products_url = f'{root_url}/catp/api/ext/produto'

    headers = {
        "Content-Type": "application/json",
        "Authorization": set_token, 
        "X-CSRF-Token": csrf_token
    }

    filters = {
        'cpfCnpjRaiz': raiz, 
        'situacao': 0
    }

    try:
        response = requests.get(get_products_url, headers=headers, params=filters)
        if response.status_code == 200:
            results = response.json()
        else:
            return jsonify({
                'error': 'Erro ao enviar requisição',
                'status_code': response.status_code,
                'details': response.text
            }), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Erro na conexão: {str(e)}'}), 500

    # Criar Excel na memória
    wb = Workbook()
    ws = wb.active

    for product in results:
        codigos_interno = product.get('codigosInterno', [''])
        ws.append([
            product.get('codigo', ''),
            product.get('ncm', ''),
            product.get('cpfCnpjRaiz', ''),
            product.get('descricao', ''),
            product.get('denominacao', ''),
            codigos_interno[0] if codigos_interno else '',
            product.get('modalidade', ''),
            product.get('situacao', ''),
            product.get('versao', '')
        ])

    # Cabeçalhos
    ws.insert_rows(0)
    ws['A1'] = 'Código'
    ws['B1'] = 'NCM'
    ws['C1'] = 'Raiz'
    ws['D1'] = 'Descrição'
    ws['E1'] = 'Denominação'
    ws['F1'] = 'Código Interno'
    ws['G1'] = 'Modalidade'
    ws['H1'] = 'Situação'
    ws['I1'] = 'Versão'

    # Salvar em memória
    output = BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f'products_{raiz}.xlsx'

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )

@app.route('/make-sheet', methods=['POST'])
def makeSheet():
    # Verifica se a requisição contém o arquivo
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']

    # Verifica se o arquivo não foi enviado vazio
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    df = pd.read_excel(file)
    
    relation_json = get_relation_json(prod=PROD)

    wb = makeFillSheet(df, relation_json)

    file_stream = BytesIO()
    wb.save(file_stream)
    file_stream.seek(0)

    return send_file(
        file_stream,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='fill_sheet.xlsx'
    )

@app.route('/products-payload', methods=['POST'])
def productsPayload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    df = pd.read_excel(file)

    products = excel_to_dict(df)
    
    relation_json = get_relation_json(prod=PROD)

    payload, errors = makeProductsPayload(products, relation_json)

    if len(errors) > 0:
        return jsonify(errors), 422
    else:
        return jsonify(payload), 200

@app.route('/post-products', methods=['POST'])
def postProducts():
    session_id = request.headers['session-id']
    payload = request.json['payload']

    tokens = r.get(session_id)

    if tokens:
        tokens = json.loads(tokens)
    else:
        return jsonify({"error": "Session expired or invalid"}), 401

    url_path = '/catp/api/ext/produto'

    headers = {
        "Content-Type": "application/json",
        "Authorization": tokens['set-token'],
        "X-CSRF-Token": tokens['x-csrf-token']
    }

    response = post_payload(url_path=url_path, headers=headers, payload=payload, chunk_size=100, prod=PROD)

    return jsonify(response)


@app.route('/authenticate-certificate', methods=['POST'])
def authenticateCertificate():

    certificate_file = request.files['file']
    certificate_password = request.headers['password']

    print(certificate_password)
    
    auth_response = autorizate(certificate_file, certificate_password, prod=PROD)

    print(auth_response)

    if auth_response.get('status') == 200:

        session_id = str(uuid.uuid4())

        tokens = {
            'x-csrf-token': auth_response['csrf-token'],
            'set-token': auth_response['set-token']
        }

        exp_seconds = int(auth_response['exp']) / 1000
        now_seconds = time.time()
        exp_time = int(exp_seconds - now_seconds)

        r.set(session_id, json.dumps(tokens), ex=exp_time)

        return jsonify({"session-id": session_id}), auth_response['status']
    else:
        return jsonify(auth_response), auth_response['status']

if __name__ == '__main__':
    app.run()